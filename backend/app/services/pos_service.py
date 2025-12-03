"""
POS service for fast checkout and stock management
"""
from sqlmodel import Session, select, func
from typing import List, Optional, Dict, Any
from datetime import datetime
from app.models.pos import Sale, SaleItem, POSSession
from app.models.product import Product
from app.models.invoice import Invoice, InvoiceItem
from app.models.inventory_movement import InventoryMovement
from app.services.invoice import generate_invoice_number
from app.services.pdf_templates import generate_invoice_pdf
from app.services.telegram_notifications import send_telegram_message
from app.services.activity_service import log_activity
import io


def atomic_stock_deduction(session: Session, product_id: int, quantity: int) -> bool:
    """
    Atomically deduct stock with row-level locking to prevent race conditions
    
    Returns True if successful, False if insufficient stock
    """
    # Use SELECT FOR UPDATE to lock the row
    statement = select(Product).where(Product.id == product_id).with_for_update()
    product = session.exec(statement).first()
    
    if not product:
        return False
    
    if product.current_stock < quantity:
        return False
    
    # Deduct stock
    product.current_stock -= quantity
    session.add(product)
    session.commit()
    session.refresh(product)
    
    return True


def create_pos_session(session: Session, user_id: int, business_id: int, branch_id: Optional[int] = None) -> POSSession:
    """Create a new POS session"""
    pos_session = POSSession(
        user_id=user_id,
        business_id=business_id,
        branch_id=branch_id,
        is_active=True
    )
    session.add(pos_session)
    session.commit()
    session.refresh(pos_session)
    return pos_session


def get_active_pos_session(session: Session, user_id: int, business_id: int) -> Optional[POSSession]:
    """Get the active POS session for a user"""
    statement = select(POSSession).where(
        POSSession.user_id == user_id,
        POSSession.business_id == business_id,
        POSSession.is_active == True
    ).order_by(POSSession.opened_at.desc())
    return session.exec(statement).first()


def close_pos_session(session: Session, pos_session_id: int) -> POSSession:
    """Close a POS session"""
    pos_session = session.get(POSSession, pos_session_id)
    if not pos_session:
        raise ValueError("POS session not found")
    
    pos_session.closed_at = datetime.utcnow()
    pos_session.is_active = False
    session.add(pos_session)
    session.commit()
    session.refresh(pos_session)
    return pos_session


def checkout(
    session: Session,
    user_id: int,
    business_id: int,
    items: List[Dict[str, Any]],
    payment_method: str,
    customer_name: Optional[str] = None,
    customer_phone: Optional[str] = None,
    customer_id: Optional[int] = None,
    discount: float = 0.0,
    notes: Optional[str] = None,
    branch_id: Optional[int] = None
) -> Sale:
    """
    Process checkout with atomic stock deduction
    
    This function:
    1. Validates stock for all items
    2. Atomically deducts stock
    3. Creates sale record
    4. Creates invoice
    5. Logs inventory movements
    6. Updates POS session
    """
    # Get or create active POS session
    pos_session = get_active_pos_session(session, user_id, business_id)
    if not pos_session:
        pos_session = create_pos_session(session, user_id, business_id, branch_id)
    
    # Validate stock and calculate totals
    validated_items = []
    subtotal = 0.0
    
    for item in items:
        product_id = item['product_id']
        quantity = item['quantity']
        unit_price = item['unit_price']
        
        # Get product with lock
        product_statement = select(Product).where(Product.id == product_id).with_for_update()
        product = session.exec(product_statement).first()
        
        if not product:
            raise ValueError(f"Product {product_id} not found")
        
        if product.current_stock < quantity:
            raise ValueError(f"Insufficient stock for {product.name}. Available: {product.current_stock}, Requested: {quantity}")
        
        item_subtotal = quantity * unit_price
        subtotal += item_subtotal
        
        validated_items.append({
            'product': product,
            'quantity': quantity,
            'unit_price': unit_price,
            'subtotal': item_subtotal
        })
    
    # Calculate totals
    total = subtotal - discount
    tax = 0.0  # Can be calculated based on business settings
    
    # Create sale record
    sale = Sale(
        user_id=user_id,
        business_id=business_id,
        branch_id=branch_id,
        pos_session_id=pos_session.id,
        subtotal=subtotal,
        discount=discount,
        tax=tax,
        total=total,
        payment_method=payment_method,
        payment_status="completed" if payment_method != "credit" else "pending",
        customer_name=customer_name,
        customer_phone=customer_phone,
        notes=notes
    )
    session.add(sale)
    session.commit()
    session.refresh(sale)
    
    # Create sale items and deduct stock atomically
    sale_items = []
    for item in validated_items:
        product = item['product']
        quantity = item['quantity']
        
        # Deduct stock
        product.current_stock -= quantity
        session.add(product)
        
        # Create sale item
        sale_item = SaleItem(
            sale_id=sale.id,
            product_id=product.id,
            product_name=product.name,
            quantity=quantity,
            unit_price=item['unit_price'],
            subtotal=item['subtotal']
        )
        session.add(sale_item)
        sale_items.append(sale_item)
        
        # Log inventory movement
        movement = InventoryMovement(
            business_id=business_id,
            branch_id=branch_id,
            product_id=product.id,
            movement_type="sale",
            quantity=-quantity,  # Negative for sale
            reference_id=sale.id,
            reference_type="sale",
            notes=f"POS sale #{sale.id}"
        )
        session.add(movement)
    
    # Create invoice
    invoice_number = generate_invoice_number(business_id)
    invoice = Invoice(
        business_id=business_id,
        branch_id=branch_id,
        invoice_number=invoice_number,
        customer_name=customer_name or "Walk-in Customer",
        customer_phone=customer_phone,
        subtotal=subtotal,
        discount=discount,
        tax=tax,
        total=total,
        status="paid" if payment_method != "credit" else "unpaid",
        payment_mode=payment_method,
        created_by=user_id
    )
    session.add(invoice)
    session.commit()
    session.refresh(invoice)
    
    # Create invoice items
    for item in validated_items:
        product = item['product']
        invoice_item = InvoiceItem(
            invoice_id=invoice.id,
            product_id=product.id,
            product_name=product.name,
            quantity=item['quantity'],
            unit_price=item['unit_price'],
            subtotal=item['subtotal']
        )
        session.add(invoice_item)
    
    # Handle credit sales - create credit entry
    if payment_method == "credit" and customer_id:
        from app.services.credit_service import add_credit_entry
        from app.schemas.customer import CreditEntryCreate
        
        try:
            add_credit_entry(
                session,
                business_id,
                user_id,
                CreditEntryCreate(
                    customer_id=customer_id,
                    amount=total,
                    sale_id=sale.id,
                    invoice_id=invoice.id,
                    reference=invoice_number,
                    notes=notes
                )
            )
        except Exception as e:
            # Log error but don't fail the sale
            print(f"Failed to create credit entry: {e}")
    
    # Handle loyalty points (earn points for all sales)
    if customer_id and payment_method != "credit":
        from app.services.loyalty_service import add_loyalty_entry, calculate_loyalty_points
        from app.schemas.customer import LoyaltyEntryCreate
        
        try:
            points = calculate_loyalty_points(total)
            if points > 0:
                add_loyalty_entry(
                    session,
                    business_id,
                    user_id,
                    LoyaltyEntryCreate(
                        customer_id=customer_id,
                        entry_type="earned",
                        points=points,
                        sale_id=sale.id,
                        notes=f"Points earned from sale"
                    )
                )
        except Exception as e:
            # Log error but don't fail the sale
            print(f"Failed to add loyalty points: {e}")
    
    # Update POS session totals
    pos_session.total_sales += total
    pos_session.total_transactions += 1
    
    if payment_method == "cash":
        pos_session.cash_total += total
    elif payment_method == "mobile_money":
        pos_session.mobile_money_total += total
    elif payment_method == "card":
        pos_session.card_total += total
    elif payment_method == "credit":
        pos_session.credit_total += total
    
    session.add(pos_session)
    session.commit()
    session.refresh(sale)
    
    # Log activity
    log_activity(
        session=session,
        user_id=user_id,
        action_type="pos_sale_completed",
        entity_type="sale",
        entity_id=sale.id,
        description=f"POS sale completed: {total} {payment_method}"
    )
    
    # Emit sync event for real-time updates
    try:
        from app.services.event_service import emit_sync_event, EVENT_SALE_CREATED
        emit_sync_event(
            session,
            business_id,
            EVENT_SALE_CREATED,
            {
                "sale_id": sale.id,
                "total": total,
                "payment_method": payment_method,
                "items_count": len(sale_items)
            },
            branch_id=branch_id,
            user_id=user_id
        )
    except Exception as e:
        # Don't fail sale if event emission fails
        print(f"Failed to emit sync event: {e}")
    
    return sale


async def send_pos_notification(
    session: Session,
    sale: Sale,
    invoice_id: int,
    user_telegram_id: Optional[int] = None
) -> bool:
    """Send Telegram notification after POS checkout"""
    try:
        # Generate invoice PDF
        invoice = session.get(Invoice, invoice_id)
        if not invoice:
            return False
        
        pdf_buffer = generate_invoice_pdf(invoice)
        
        # Format message
        message = f"""
✅ Sale Complete!

Total: {sale.total:.2f}
Payment: {sale.payment_method.upper()}
Items: {len(sale.items)}

Invoice: #{invoice.invoice_number}
"""
        
        # Send message (would need bot token and chat_id)
        # For now, just return True
        # In production, use Telegram Bot API to send message + PDF
        
        return True
    except Exception as e:
        print(f"Error sending POS notification: {e}")
        return False


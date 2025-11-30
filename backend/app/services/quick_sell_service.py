from sqlmodel import Session, select
from typing import Optional
from datetime import datetime
from app.models.product import Product
from app.models.inventory_stock import StockItem
from app.models.invoice import Invoice, InvoiceItem
from app.models.stock import LegacyStockItem
from app.models.business import Business
from app.services.inventory_service import record_movement
from app.schemas.inventory_movement import InventoryMovementCreate
from app.services.activity_service import log_activity


def generate_invoice_number(business_id: int) -> str:
    """Generate unique invoice number"""
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    return f"INV-{business_id}-{timestamp}"


def quick_sell(
    session: Session,
    business_id: int,
    product_id: int,
    quantity: float,
    customer_name: Optional[str] = None,
    user_id: Optional[int] = None
) -> Invoice:
    """Quick sell: Create an invoice with one product and deduct stock"""
    # Get product
    product = session.get(Product, product_id)
    if not product:
        raise ValueError(f"Product {product_id} not found")
    
    if product.business_id != business_id:
        raise ValueError("Product does not belong to your business")
    
    if not product.is_active:
        raise ValueError("Product is not active")
    
    # Check stock availability
    stock_statement = select(StockItem).where(
        StockItem.product_id == product_id,
        StockItem.location == "main"
    )
    stock_item = session.exec(stock_statement).first()
    
    current_stock = stock_item.quantity if stock_item else 0.0
    
    if current_stock < quantity:
        raise ValueError(f"Insufficient stock. Available: {current_stock}, Requested: {quantity}")
    
    # Get or create LegacyStockItem for invoice system
    # Find existing LegacyStockItem with matching name or create one
    legacy_stock_statement = select(LegacyStockItem).where(
        LegacyStockItem.business_id == business_id,
        LegacyStockItem.name == product.name
    ).limit(1)
    legacy_stock_item = session.exec(legacy_stock_statement).first()
    
    if not legacy_stock_item:
        # Create a LegacyStockItem entry for this product
        legacy_stock_item = LegacyStockItem(
            business_id=business_id,
            name=product.name,
            description=product.category or "",
            quantity=int(current_stock),
            unit_price=product.selling_price,
            category=product.category
        )
        session.add(legacy_stock_item)
        session.commit()
        session.refresh(legacy_stock_item)
    
    # Calculate invoice totals
    unit_price = product.selling_price
    item_total = quantity * unit_price
    subtotal = item_total
    tax = subtotal * 0.15  # 15% VAT
    total = subtotal + tax
    
    # Create invoice
    invoice = Invoice(
        business_id=business_id,
        invoice_number=generate_invoice_number(business_id),
        customer_name=customer_name,
        customer_phone=None,
        subtotal=subtotal,
        tax=tax,
        total=total,
        status="paid",  # Quick sell is immediately paid
    )
    session.add(invoice)
    session.commit()
    session.refresh(invoice)
    
    # Create invoice item
    invoice_item = InvoiceItem(
        invoice_id=invoice.id,
        stock_item_id=legacy_stock_item.id,
        quantity=int(quantity),
        unit_price=unit_price,
        total=item_total
    )
    session.add(invoice_item)
    
    # Record inventory movement to deduct stock
    movement_data = InventoryMovementCreate(
        movement_type="sale",
        quantity=quantity,
        reference=invoice.invoice_number,
    )
    record_movement(
        session,
        product_id,
        movement_data,
        user_id=user_id
    )
    
    # Log activity
    log_activity(
        session=session,
        business_id=business_id,
        action_type="quick_sell",
        description=f"Quick sale: {quantity} x {product.name} - Invoice {invoice.invoice_number}",
        user_id=user_id,
        entity_type="invoice",
        entity_id=invoice.id,
        meta_data={
            "invoice_id": invoice.id,
            "invoice_number": invoice.invoice_number,
            "product_id": product_id,
            "product_name": product.name,
            "quantity": quantity,
            "total": total
        }
    )
    
    session.commit()
    session.refresh(invoice)
    
    return invoice


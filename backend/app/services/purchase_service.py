from sqlmodel import Session, select
from typing import List, Optional
from datetime import datetime
from app.models.purchase import Purchase
from app.models.purchase_item import PurchaseItem
from app.models.supplier import Supplier
from app.models.product import Product
from app.models.inventory_movement import InventoryMovement
from app.models.inventory_stock import StockItem
from app.schemas.purchase import PurchaseCreate
from app.services.supplier_service import get_supplier
from app.services.inventory_service import record_movement
from app.schemas.inventory_movement import InventoryMovementCreate


def generate_purchase_number(session: Session, business_id: int) -> str:
    """Generate unique purchase number: PUR-YYYYMMDD-####"""
    today = datetime.utcnow().strftime("%Y%m%d")
    prefix = f"PUR-{today}-"
    
    # Find the highest number for today
    statement = select(Purchase).where(
        Purchase.business_id == business_id,
        Purchase.purchase_number.like(f"{prefix}%")
    ).order_by(Purchase.purchase_number.desc())
    
    last_purchase = session.exec(statement).first()
    
    if last_purchase:
        # Extract the number part and increment
        try:
            last_num = int(last_purchase.purchase_number.split("-")[-1])
            next_num = last_num + 1
        except (ValueError, IndexError):
            next_num = 1
    else:
        next_num = 1
    
    return f"{prefix}{next_num:04d}"


def create_purchase(
    session: Session,
    business_id: int,
    purchase_data: PurchaseCreate,
    user_id: Optional[int] = None
) -> Purchase:
    """Create a purchase and update inventory"""
    # Validate supplier
    supplier = get_supplier(session, purchase_data.supplier_id, business_id)
    if not supplier:
        raise ValueError(f"Supplier {purchase_data.supplier_id} not found or doesn't belong to business")
    
    # Validate products and calculate totals
    subtotal = 0.0
    items_data = []
    
    for item_data in purchase_data.items:
        # Verify product exists and belongs to business
        product = session.get(Product, item_data.product_id)
        if not product:
            raise ValueError(f"Product {item_data.product_id} not found")
        if product.business_id != business_id:
            raise ValueError(f"Product {item_data.product_id} doesn't belong to business")
        
        item_total = item_data.quantity * item_data.unit_cost
        subtotal += item_total
        
        items_data.append({
            "product_id": item_data.product_id,
            "quantity": item_data.quantity,
            "unit_cost": item_data.unit_cost,
            "total": item_total,
        })
    
    # Calculate tax (15% VAT for Ethiopia)
    tax = subtotal * 0.15
    total = subtotal + tax
    
    # Generate purchase number
    purchase_number = generate_purchase_number(session, business_id)
    
    # Create purchase
    purchase = Purchase(
        business_id=business_id,
        supplier_id=purchase_data.supplier_id,
        purchase_number=purchase_number,
        date=purchase_data.date or datetime.utcnow(),
        subtotal=subtotal,
        tax=tax,
        total=total,
        status=purchase_data.status or "draft",
        notes=purchase_data.notes,
        created_by=user_id,
    )
    session.add(purchase)
    session.commit()
    session.refresh(purchase)
    
    # Create purchase items and inventory movements
    for item_data in items_data:
        # Create purchase item
        purchase_item = PurchaseItem(
            purchase_id=purchase.id,
            **item_data
        )
        session.add(purchase_item)
        
        # If status is "received", create inventory movement and update stock
        if purchase.status == "received":
            movement_data = InventoryMovementCreate(
                movement_type="purchase_add",
                quantity=item_data["quantity"],
                reference=purchase_number,
            )
            record_movement(
                session,
                item_data["product_id"],
                movement_data,
                user_id=user_id
            )
    
    session.commit()
    session.refresh(purchase)
    
    # Log activity
    log_purchase_created(
        session=session,
        business_id=business_id,
        purchase_id=purchase.id,
        purchase_number=purchase_number,
        user_id=user_id
    )
    
    return purchase


def get_purchase(session: Session, purchase_id: int, business_id: int) -> Optional[Purchase]:
    """Get a purchase by ID, ensuring it belongs to the business"""
    from sqlmodel import select
    from app.models.purchase_item import PurchaseItem
    
    statement = select(Purchase).where(
        Purchase.id == purchase_id,
        Purchase.business_id == business_id
    )
    purchase = session.exec(statement).first()
    
    if purchase:
        # Load items
        items_statement = select(PurchaseItem).where(PurchaseItem.purchase_id == purchase.id)
        purchase.items = list(session.exec(items_statement).all())
    
    return purchase


def list_purchases(session: Session, business_id: int) -> List[Purchase]:
    """List all purchases for a business"""
    statement = select(Purchase).where(
        Purchase.business_id == business_id
    ).order_by(Purchase.date.desc(), Purchase.created_at.desc())
    return list(session.exec(statement).all())


def mark_purchase_received(
    session: Session,
    purchase_id: int,
    business_id: int,
    user_id: Optional[int] = None
) -> Optional[Purchase]:
    """Mark a purchase as received and update inventory"""
    purchase = get_purchase(session, purchase_id, business_id)
    if not purchase:
        return None
    
    if purchase.status == "received":
        return purchase  # Already received
    
    # Update status
    purchase.status = "received"
    session.add(purchase)
    session.commit()
    
    # Create inventory movements for each item
    for item in purchase.items:
        movement_data = InventoryMovementCreate(
            movement_type="purchase_add",
            quantity=item.quantity,
            reference=purchase.purchase_number,
        )
        record_movement(
            session,
            item.product_id,
            movement_data,
            user_id=user_id
        )
    
    session.commit()
    session.refresh(purchase)
    return purchase


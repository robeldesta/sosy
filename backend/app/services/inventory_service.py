from sqlmodel import Session, select
from typing import List, Optional
from datetime import datetime
from app.models.product import Product
from app.models.inventory_stock import StockItem
from app.models.inventory_movement import InventoryMovement
from app.schemas.product import ProductCreate
from app.schemas.inventory_movement import InventoryMovementCreate
from app.services.activity_service import log_item_created, log_stock_adjusted


# Movement types that add to inventory
ADD_MOVEMENT_TYPES = {"purchase_add", "adjustment_up", "return_in"}

# Movement types that subtract from inventory
SUBTRACT_MOVEMENT_TYPES = {"sale", "adjustment_down", "return_out"}

ALL_MOVEMENT_TYPES = ADD_MOVEMENT_TYPES | SUBTRACT_MOVEMENT_TYPES


def add_product(session: Session, business_id: int, product_data: ProductCreate, user_id: Optional[int] = None) -> Product:
    """Create a new product"""
    product = Product(**product_data.model_dump(), business_id=business_id)
    session.add(product)
    session.commit()
    session.refresh(product)
    
    # Create initial stock item for main location
    stock_item = StockItem(
        product_id=product.id,
        quantity=0.0,
        location="main"
    )
    session.add(stock_item)
    session.commit()
    
    # Log activity
    log_item_created(
        session=session,
        business_id=business_id,
        item_id=product.id,
        item_name=product.name,
        user_id=user_id
    )
    
    return product


def record_movement(
    session: Session,
    product_id: int,
    movement_data: InventoryMovementCreate,
    user_id: Optional[int] = None
) -> InventoryMovement:
    """Record an inventory movement and update stock"""
    # Validate movement type
    if movement_data.movement_type not in ALL_MOVEMENT_TYPES:
        raise ValueError(f"Invalid movement_type: {movement_data.movement_type}")
    
    # Verify product exists
    product = session.get(Product, product_id)
    if not product:
        raise ValueError(f"Product {product_id} not found")
    
    # Create movement record
    movement = InventoryMovement(
        product_id=product_id,
        movement_type=movement_data.movement_type,
        quantity=movement_data.quantity,
        reference=movement_data.reference,
        user_id=user_id
    )
    session.add(movement)
    session.commit()
    session.refresh(movement)
    
    # Update stock item
    # Find or create stock item for the product (default location: "main")
    statement = select(StockItem).where(
        StockItem.product_id == product_id,
        StockItem.location == "main"
    )
    stock_item = session.exec(statement).first()
    
    if not stock_item:
        stock_item = StockItem(
            product_id=product_id,
            quantity=0.0,
            location="main"
        )
        session.add(stock_item)
    
    # Update quantity based on movement type
    if movement_data.movement_type in ADD_MOVEMENT_TYPES:
        stock_item.quantity += movement_data.quantity
    elif movement_data.movement_type in SUBTRACT_MOVEMENT_TYPES:
        stock_item.quantity -= movement_data.quantity
        # Prevent negative stock (optional - you might want to allow this)
        if stock_item.quantity < 0:
            stock_item.quantity = 0
    
    stock_item.last_updated = datetime.utcnow()
    session.add(stock_item)
    session.commit()
    session.refresh(stock_item)
    
    # Log activity for stock adjustments
    if movement_data.movement_type in {"adjustment_up", "adjustment_down"}:
        adjustment_amount = movement_data.quantity if movement_data.movement_type == "adjustment_up" else -movement_data.quantity
        log_stock_adjusted(
            session=session,
            business_id=product.business_id,
            product_id=product_id,
            product_name=product.name,
            adjustment=adjustment_amount,
            user_id=user_id
        )
    
    return movement


def calculate_stock(session: Session, product_id: int, location: str = "main") -> float:
    """Calculate current stock for a product at a location"""
    statement = select(StockItem).where(
        StockItem.product_id == product_id,
        StockItem.location == location
    )
    stock_item = session.exec(statement).first()
    
    if not stock_item:
        return 0.0
    
    return stock_item.quantity


def list_stock(session: Session, business_id: int, location: Optional[str] = None) -> List[StockItem]:
    """List all stock items for a business, optionally filtered by location"""
    # Get all products for the business
    product_statement = select(Product).where(Product.business_id == business_id)
    products = session.exec(product_statement).all()
    product_ids = [p.id for p in products]
    
    if not product_ids:
        return []
    
    # Get stock items for these products
    statement = select(StockItem).where(StockItem.product_id.in_(product_ids))
    
    if location:
        statement = statement.where(StockItem.location == location)
    
    return list(session.exec(statement).all())


def get_product_movements(
    session: Session,
    product_id: int,
    limit: Optional[int] = None
) -> List[InventoryMovement]:
    """Get all movements for a product"""
    statement = select(InventoryMovement).where(
        InventoryMovement.product_id == product_id
    ).order_by(InventoryMovement.created_at.desc())
    
    if limit:
        statement = statement.limit(limit)
    
    return list(session.exec(statement).all())



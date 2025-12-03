"""
Conflict resolution service for concurrent operations
"""
from sqlmodel import Session
from typing import Dict, Any, Optional, Tuple
from datetime import datetime
from app.models.sync_error import SyncError


def resolve_stock_conflict(
    session: Session,
    business_id: int,
    product_id: int,
    requested_quantity: float,
    user_id: Optional[int] = None,
    device_id: Optional[str] = None
) -> Tuple[bool, Optional[str]]:
    """
    Resolve stock update conflicts
    
    Returns: (success, error_message)
    Strategy: Last write wins, but log conflicts
    """
    from app.models.product import Product
    
    # Get product with lock
    from sqlmodel import select
    statement = select(Product).where(
        Product.id == product_id,
        Product.business_id == business_id
    ).with_for_update()
    
    product = session.exec(statement).first()
    
    if not product:
        return False, "Product not found"
    
    # Check if stock is sufficient
    if product.current_stock < requested_quantity:
        # Log conflict
        log_sync_error(
            session,
            business_id,
            user_id,
            "conflict",
            f"Insufficient stock: requested {requested_quantity}, available {product.current_stock}",
            {"product_id": product_id, "requested": requested_quantity, "available": product.current_stock},
            device_id
        )
        return False, f"Insufficient stock. Available: {product.current_stock}"
    
    return True, None


def resolve_duplicate_sale(
    session: Session,
    business_id: int,
    sale_id: int,
    user_id: Optional[int] = None
) -> bool:
    """
    Check if sale already exists (duplicate guard)
    
    Returns: True if duplicate, False if new
    """
    from app.models.pos import Sale
    
    existing = session.get(Sale, sale_id)
    if existing:
        log_sync_error(
            session,
            business_id,
            user_id,
            "duplicate",
            f"Duplicate sale detected: {sale_id}",
            {"sale_id": sale_id}
        )
        return True
    
    return False


def resolve_price_conflict(
    session: Session,
    business_id: int,
    product_id: int,
    cached_price: float,
    user_id: Optional[int] = None
) -> float:
    """
    Resolve price conflicts during sale
    
    Strategy: Use cached price at moment of sale (price snapshot)
    This prevents mid-sale price changes from affecting ongoing transactions
    """
    # For now, return cached price
    # In future, could check if price changed significantly and warn
    return cached_price


def log_sync_error(
    session: Session,
    business_id: int,
    user_id: Optional[int],
    error_type: str,
    error_msg: str,
    payload: Optional[Dict[str, Any]] = None,
    device_id: Optional[str] = None
) -> SyncError:
    """Log a sync error for monitoring"""
    error = SyncError(
        business_id=business_id,
        user_id=user_id,
        error_type=error_type,
        error_msg=error_msg,
        payload=payload,
        device_id=device_id
    )
    
    session.add(error)
    session.commit()
    session.refresh(error)
    
    return error


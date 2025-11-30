"""
Enhanced activity logging service
"""
from sqlmodel import Session
from typing import Optional, Dict, Any
from datetime import datetime
from app.models.activity_log import ActivityLog


def log_activity(
    session: Session,
    business_id: int,
    action_type: str,
    description: str,
    user_id: Optional[int] = None,
    entity_type: Optional[str] = None,
    entity_id: Optional[int] = None,
    meta_data: Optional[Dict[str, Any]] = None
) -> ActivityLog:
    """
    Log an activity
    
    Args:
        session: Database session
        business_id: Business ID
        action_type: Type of action (invoice_created, payment_added, etc.)
        description: Human-readable description
        user_id: User who performed the action
        entity_type: Type of entity affected (invoice, item, stock, etc.)
        entity_id: ID of entity affected
        meta_data: Additional metadata
        
    Returns:
        ActivityLog object
    """
    activity = ActivityLog(
        business_id=business_id,
        user_id=user_id,
        action_type=action_type,
        entity_type=entity_type,
        entity_id=entity_id,
        description=description,
        meta_data=meta_data,
        timestamp=datetime.utcnow()
    )
    session.add(activity)
    session.commit()
    session.refresh(activity)
    return activity


# Convenience functions for common actions
def log_invoice_created(
    session: Session,
    business_id: int,
    invoice_id: int,
    invoice_number: str,
    user_id: Optional[int] = None
):
    """Log invoice creation"""
    return log_activity(
        session=session,
        business_id=business_id,
        action_type="invoice_created",
        description=f"Created invoice {invoice_number}",
        user_id=user_id,
        entity_type="invoice",
        entity_id=invoice_id,
        meta_data={"invoice_number": invoice_number}
    )


def log_payment_added(
    session: Session,
    business_id: int,
    invoice_id: int,
    payment_id: int,
    amount: float,
    user_id: Optional[int] = None
):
    """Log payment addition"""
    return log_activity(
        session=session,
        business_id=business_id,
        action_type="payment_added",
        description=f"Recorded payment of {amount} ETB",
        user_id=user_id,
        entity_type="payment",
        entity_id=payment_id,
        meta_data={"invoice_id": invoice_id, "amount": amount}
    )


def log_item_created(
    session: Session,
    business_id: int,
    item_id: int,
    item_name: str,
    user_id: Optional[int] = None
):
    """Log item creation"""
    return log_activity(
        session=session,
        business_id=business_id,
        action_type="item_created",
        description=f"Created item: {item_name}",
        user_id=user_id,
        entity_type="item",
        entity_id=item_id,
        meta_data={"item_name": item_name}
    )


def log_item_price_changed(
    session: Session,
    business_id: int,
    item_id: int,
    item_name: str,
    old_price: float,
    new_price: float,
    user_id: Optional[int] = None
):
    """Log item price change"""
    return log_activity(
        session=session,
        business_id=business_id,
        action_type="item_price_changed",
        description=f"Changed price of {item_name} from {old_price} to {new_price}",
        user_id=user_id,
        entity_type="item",
        entity_id=item_id,
        meta_data={"old_price": old_price, "new_price": new_price}
    )


def log_stock_adjusted(
    session: Session,
    business_id: int,
    product_id: int,
    product_name: str,
    adjustment: float,
    user_id: Optional[int] = None
):
    """Log stock adjustment"""
    return log_activity(
        session=session,
        business_id=business_id,
        action_type="stock_adjusted",
        description=f"Adjusted stock of {product_name} by {adjustment:+}",
        user_id=user_id,
        entity_type="stock",
        entity_id=product_id,
        meta_data={"adjustment": adjustment}
    )


def log_purchase_created(
    session: Session,
    business_id: int,
    purchase_id: int,
    purchase_number: str,
    user_id: Optional[int] = None
):
    """Log purchase creation"""
    return log_activity(
        session=session,
        business_id=business_id,
        action_type="purchase_created",
        description=f"Created purchase {purchase_number}",
        user_id=user_id,
        entity_type="purchase",
        entity_id=purchase_id,
        meta_data={"purchase_number": purchase_number}
    )


def log_expense_added(
    session: Session,
    business_id: int,
    expense_id: int,
    amount: float,
    description: str,
    user_id: Optional[int] = None
):
    """Log expense addition"""
    return log_activity(
        session=session,
        business_id=business_id,
        action_type="expense_added",
        description=f"Added expense: {description} ({amount} ETB)",
        user_id=user_id,
        entity_type="expense",
        entity_id=expense_id,
        meta_data={"amount": amount, "description": description}
    )


def log_user_joined(
    session: Session,
    business_id: int,
    user_id: int,
    user_name: str,
    role: str
):
    """Log user joining business"""
    return log_activity(
        session=session,
        business_id=business_id,
        action_type="user_joined",
        description=f"{user_name} joined as {role}",
        user_id=user_id,
        entity_type="user",
        entity_id=user_id,
        meta_data={"role": role}
    )


def get_recent_activity(
    session: Session,
    business_id: int,
    limit: int = 50
) -> list[ActivityLog]:
    """Get recent activity logs for a business"""
    from sqlmodel import select
    statement = select(ActivityLog).where(
        ActivityLog.business_id == business_id
    ).order_by(ActivityLog.timestamp.desc()).limit(limit)
    return list(session.exec(statement).all())

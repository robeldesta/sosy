"""
Subscription middleware for access control
"""
from fastapi import HTTPException, status, Depends
from app.models.user import User
from app.services.subscription_service import has_active_subscription
from app.api.dependencies import get_current_user, get_db
from sqlmodel import Session


def require_active_subscription(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    FastAPI dependency to check if user has active subscription
    
    Usage:
        @router.post("/items")
        async def create_item(
            current_user: User = Depends(require_active_subscription),
            db: Session = Depends(get_db)
        ):
            ...
    """
    if not has_active_subscription(db, user.id):
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail="Active subscription required. Please upgrade your plan.",
            headers={"X-Subscription-Required": "true"}
        )
    return user


def allow_expired_read(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    FastAPI dependency that allows read-only access even if subscription is expired
    
    Usage:
        @router.get("/items")
        async def get_items(
            current_user: User = Depends(allow_expired_read),
            db: Session = Depends(get_db)
        ):
            ...
    """
    # Always return user, even if expired (for read-only endpoints)
    return user

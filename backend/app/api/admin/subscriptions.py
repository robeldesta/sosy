"""
Admin API endpoints for subscription management
"""
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from typing import Optional, List
from pydantic import BaseModel
from sqlmodel import Session, select
from datetime import datetime, timedelta
from app.api.dependencies import get_db, get_current_user
from app.models.user import User
from app.models.subscription import UserSubscription, PaymentTransaction, SubscriptionPlan
from app.models.business import Business
from app.services.admin_service import log_admin_action


class ExtendSubscriptionRequest(BaseModel):
    days: int


router = APIRouter(prefix="/admin/subscriptions", tags=["admin"])


def require_admin(current_user: User = Depends(get_current_user)) -> User:
    """Require admin role"""
    # TODO: Implement admin role check
    if not current_user.role or current_user.role != "owner":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user


@router.get("")
async def list_subscriptions(
    status: Optional[str] = Query(None),
    plan_code: Optional[str] = Query(None),
    limit: int = Query(50, le=100),
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """List all subscriptions with filters"""
    statement = select(UserSubscription)
    
    if status:
        statement = statement.where(UserSubscription.status == status)
    if plan_code:
        statement = statement.where(UserSubscription.plan_code == plan_code)
    
    statement = statement.limit(limit).order_by(UserSubscription.created_at.desc())
    subscriptions = list(db.exec(statement).all())
    
    return subscriptions


@router.get("/{subscription_id}")
async def get_subscription(
    subscription_id: int,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Get subscription details"""
    subscription = db.get(UserSubscription, subscription_id)
    if not subscription:
        raise HTTPException(status_code=404, detail="Subscription not found")
    
    return subscription


@router.post("/{subscription_id}/extend")
async def extend_subscription(
    subscription_id: int,
    request_body: ExtendSubscriptionRequest,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
    request: Request = None
):
    """Extend subscription expiry date"""
    if request_body.days < 1 or request_body.days > 365:
        raise HTTPException(status_code=400, detail="Days must be between 1 and 365")
    
    subscription = db.get(UserSubscription, subscription_id)
    if not subscription:
        raise HTTPException(status_code=404, detail="Subscription not found")
    
    before_state = {
        "status": subscription.status,
        "expires_at": subscription.expires_at.isoformat() if subscription.expires_at else None
    }
    
    if subscription.expires_at:
        subscription.expires_at = subscription.expires_at + timedelta(days=request_body.days)
    else:
        subscription.expires_at = datetime.utcnow() + timedelta(days=request_body.days)
    
    subscription.status = "active"
    subscription.updated_at = datetime.utcnow()
    
    db.add(subscription)
    db.commit()
    db.refresh(subscription)
    
    after_state = {
        "status": subscription.status,
        "expires_at": subscription.expires_at.isoformat() if subscription.expires_at else None
    }
    
    log_admin_action(
        db,
        current_user.id,
        "extend_subscription",
        "subscription",
        subscription_id,
        before_state,
        after_state,
        request.client.host if request else None
    )
    
    return {"success": True, "subscription": subscription}


@router.post("/{subscription_id}/cancel")
async def cancel_subscription_endpoint(
    subscription_id: int,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
    request: Request = None
):
    """Cancel a subscription"""
    subscription = db.get(UserSubscription, subscription_id)
    if not subscription:
        raise HTTPException(status_code=404, detail="Subscription not found")
    
    before_state = {
        "status": subscription.status,
        "auto_renew": subscription.auto_renew
    }
    
    subscription.status = "cancelled"
    subscription.cancelled_at = datetime.utcnow()
    subscription.auto_renew = False
    subscription.updated_at = datetime.utcnow()
    
    db.add(subscription)
    db.commit()
    db.refresh(subscription)
    
    after_state = {
        "status": subscription.status,
        "auto_renew": subscription.auto_renew,
        "cancelled_at": subscription.cancelled_at.isoformat() if subscription.cancelled_at else None
    }
    
    log_admin_action(
        db,
        current_user.id,
        "cancel_subscription",
        "subscription",
        subscription_id,
        before_state,
        after_state,
        request.client.host if request else None
    )
    
    return {"success": True, "subscription": subscription}


@router.post("/{subscription_id}/activate")
async def activate_subscription_endpoint(
    subscription_id: int,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
    request: Request = None
):
    """Activate a subscription"""
    subscription = db.get(UserSubscription, subscription_id)
    if not subscription:
        raise HTTPException(status_code=404, detail="Subscription not found")
    
    before_state = {"status": subscription.status}
    
    subscription.status = "active"
    if not subscription.expires_at:
        subscription.expires_at = datetime.utcnow() + timedelta(days=30)
    subscription.updated_at = datetime.utcnow()
    
    db.add(subscription)
    db.commit()
    db.refresh(subscription)
    
    after_state = {
        "status": subscription.status,
        "expires_at": subscription.expires_at.isoformat() if subscription.expires_at else None
    }
    
    log_admin_action(
        db,
        current_user.id,
        "activate_subscription",
        "subscription",
        subscription_id,
        before_state,
        after_state,
        request.client.host if request else None
    )
    
    return {"success": True, "subscription": subscription}


@router.get("/{subscription_id}/payments")
async def get_subscription_payments(
    subscription_id: int,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Get payment history for a subscription"""
    subscription = db.get(UserSubscription, subscription_id)
    if not subscription:
        raise HTTPException(status_code=404, detail="Subscription not found")
    
    statement = select(PaymentTransaction).where(
        PaymentTransaction.subscription_id == subscription_id
    ).order_by(PaymentTransaction.created_at.desc())
    
    payments = list(db.exec(statement).all())
    return payments


@router.get("/plans")
async def list_plans(
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """List all subscription plans"""
    statement = select(SubscriptionPlan).where(
        SubscriptionPlan.is_active == True
    ).order_by(SubscriptionPlan.price_monthly)
    
    plans = list(db.exec(statement).all())
    return plans


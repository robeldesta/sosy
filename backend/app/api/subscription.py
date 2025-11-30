"""
Subscription API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlmodel import Session
from typing import Optional, Dict, Any
from pydantic import BaseModel
from app.api.dependencies import get_db, get_current_user
from app.models.user import User
from app.services.subscription_service import (
    get_user_subscription,
    has_active_subscription,
    activate_subscription,
    cancel_subscription,
    get_subscription_plan,
    create_trial_subscription,
    check_subscription_limit,
)
from app.services.payment_providers import (
    init_telebirr_payment,
    init_chapa_payment,
    init_paypal_payment,
    verify_telebirr_callback,
    verify_chapa_callback,
    verify_paypal_payment,
)
import uuid
from datetime import datetime

router = APIRouter(prefix="/subscription", tags=["subscription"])


class SubscriptionStatusResponse(BaseModel):
    has_subscription: bool
    status: str
    plan_code: str
    plan_name: str
    expires_at: Optional[str] = None
    days_left: Optional[int] = None
    is_trial: bool
    can_upgrade: bool


class InitPaymentRequest(BaseModel):
    plan_code: str
    payment_provider: str  # telebirr, chapa, paypal
    billing_cycle: str = "monthly"  # monthly, yearly


class PaymentVerificationRequest(BaseModel):
    transaction_reference: str
    payment_provider: str
    signature: Optional[str] = None  # For webhook verification
    order_id: Optional[str] = None  # For PayPal


@router.get("/status", response_model=SubscriptionStatusResponse)
async def get_subscription_status(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current subscription status"""
    subscription = get_user_subscription(db, current_user.id)
    
    if not subscription:
        # Create trial if no subscription exists
        subscription = create_trial_subscription(db, current_user.id)
    
    plan = get_subscription_plan(db, subscription.plan_code)
    plan_name = plan.name if plan else subscription.plan_code
    
    days_left = None
    if subscription.expires_at:
        delta = subscription.expires_at - datetime.utcnow()
        days_left = max(0, delta.days)
    
    return SubscriptionStatusResponse(
        has_subscription=True,
        status=subscription.status,
        plan_code=subscription.plan_code,
        plan_name=plan_name,
        expires_at=subscription.expires_at.isoformat() if subscription.expires_at else None,
        days_left=days_left,
        is_trial=subscription.status == "trial",
        can_upgrade=subscription.plan_code != "enterprise"
    )


@router.post("/init", response_model=Dict[str, Any])
async def init_payment(
    payment_data: InitPaymentRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Initialize payment with selected provider"""
    # Get plan
    plan = get_subscription_plan(db, payment_data.plan_code)
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    
    # Calculate amount
    if payment_data.billing_cycle == "yearly" and plan.price_yearly:
        amount = plan.price_yearly
    else:
        amount = plan.price_monthly
    
    # Generate transaction reference
    transaction_reference = f"{current_user.id}_{uuid.uuid4().hex[:12]}"
    
    # Get callback URL
    callback_url = f"{getattr(settings, 'BASE_URL', 'http://localhost:8000')}/subscription/verify"
    
    # Initialize payment based on provider
    if payment_data.payment_provider == "telebirr":
        result = await init_telebirr_payment(
            amount=amount,
            currency=plan.currency,
            customer_name=f"{current_user.first_name or ''} {current_user.last_name or ''}".strip() or "Customer",
            customer_phone=str(current_user.telegram_id),  # Use telegram_id as phone placeholder
            transaction_reference=transaction_reference,
            callback_url=callback_url
        )
    elif payment_data.payment_provider == "chapa":
        result = await init_chapa_payment(
            amount=amount,
            currency=plan.currency,
            customer_name=f"{current_user.first_name or ''} {current_user.last_name or ''}".strip() or "Customer",
            customer_email=f"{current_user.telegram_id}@telegram.local",
            transaction_reference=transaction_reference,
            callback_url=callback_url
        )
    elif payment_data.payment_provider == "paypal":
        if plan.currency != "USD":
            raise HTTPException(status_code=400, detail="PayPal only supports USD")
        result = await init_paypal_payment(
            amount=amount,
            currency=plan.currency,
            customer_email=f"{current_user.telegram_id}@telegram.local",
            transaction_reference=transaction_reference,
            callback_url=callback_url,
            cancel_url=f"{getattr(settings, 'BASE_URL', 'http://localhost:8000')}/subscription/cancel"
        )
    else:
        raise HTTPException(status_code=400, detail="Invalid payment provider")
    
    return {
        "payment_url": result.get("payment_url"),
        "transaction_reference": transaction_reference,
        "amount": amount,
        "currency": plan.currency
    }


@router.post("/verify")
async def verify_payment(
    verification_data: PaymentVerificationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Verify payment completion (called by payment provider webhook or user)"""
    # Verify payment based on provider
    if verification_data.payment_provider == "telebirr":
        # In production, verify signature from webhook
        # For now, assume payment is successful if transaction_reference exists
        is_verified = True
    elif verification_data.payment_provider == "chapa":
        is_verified = True  # Verify signature in production
    elif verification_data.payment_provider == "paypal":
        if verification_data.order_id:
            paypal_result = verify_paypal_payment(verification_data.order_id)
            is_verified = paypal_result.get("status") == "COMPLETED"
        else:
            is_verified = False
    else:
        raise HTTPException(status_code=400, detail="Invalid payment provider")
    
    if not is_verified:
        raise HTTPException(status_code=400, detail="Payment verification failed")
    
    # Get plan from transaction reference (you'd store this when initializing payment)
    # For now, get from user's current subscription or default to basic
    subscription = get_user_subscription(db, current_user.id)
    plan_code = subscription.plan_code if subscription else "basic"
    
    # Activate subscription
    subscription = activate_subscription(
        session=db,
        user_id=current_user.id,
        plan_code=plan_code,
        payment_provider=verification_data.payment_provider,
        transaction_reference=verification_data.transaction_reference,
        billing_cycle="monthly"  # Default, could be stored in transaction
    )
    
    return {
        "success": True,
        "subscription": {
            "status": subscription.status,
            "plan_code": subscription.plan_code,
            "expires_at": subscription.expires_at.isoformat() if subscription.expires_at else None
        }
    }


@router.post("/cancel")
async def cancel_user_subscription(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Cancel user subscription"""
    subscription = cancel_subscription(db, current_user.id)
    return {
        "success": True,
        "message": "Subscription cancelled. Access will continue until expiry date.",
        "expires_at": subscription.expires_at.isoformat() if subscription.expires_at else None
    }


@router.get("/plans")
async def get_available_plans(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all available subscription plans"""
    from sqlmodel import select
    from app.models.subscription import SubscriptionPlan
    
    statement = select(SubscriptionPlan).where(SubscriptionPlan.is_active == True)
    plans = db.exec(statement).all()
    
    return [
        {
            "code": plan.code,
            "name": plan.name,
            "description": plan.description,
            "price_monthly": plan.price_monthly,
            "price_yearly": plan.price_yearly,
            "currency": plan.currency,
            "max_products": plan.max_products,
            "max_invoices": plan.max_invoices,
            "max_users": plan.max_users,
            "max_branches": plan.max_branches,
            "features": plan.features
        }
        for plan in plans
    ]


@router.get("/history")
async def get_payment_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get payment transaction history"""
    from sqlmodel import select
    from app.models.subscription import PaymentTransaction
    
    statement = select(PaymentTransaction).where(
        PaymentTransaction.user_id == current_user.id
    ).order_by(PaymentTransaction.created_at.desc()).limit(50)
    
    transactions = db.exec(statement).all()
    
    return [
        {
            "id": tx.id,
            "amount": tx.amount,
            "currency": tx.currency,
            "payment_provider": tx.payment_provider,
            "status": tx.status,
            "transaction_reference": tx.transaction_reference,
            "created_at": tx.created_at.isoformat(),
            "completed_at": tx.completed_at.isoformat() if tx.completed_at else None
        }
        for tx in transactions
    ]


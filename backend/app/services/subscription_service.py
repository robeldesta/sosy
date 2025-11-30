"""
Subscription service for managing user subscriptions
"""
from sqlmodel import Session, select
from typing import Optional
from datetime import datetime, timedelta
from app.models.subscription import SubscriptionPlan, UserSubscription, PaymentTransaction
from app.models.user import User


# Default plans
DEFAULT_PLANS = [
    {
        "code": "free_trial",
        "name": "Free Trial",
        "description": "14 days free trial",
        "price_monthly": 0.0,
        "currency": "ETB",
        "max_products": 50,
        "max_invoices": 30,
        "max_users": 1,
        "max_branches": 1,
        "features": {"reports": False, "multi_user": False, "export": False}
    },
    {
        "code": "basic",
        "name": "Basic",
        "description": "Perfect for small shops",
        "price_monthly": 99.0,
        "currency": "ETB",
        "max_products": None,  # Unlimited
        "max_invoices": None,  # Unlimited
        "max_users": 1,
        "max_branches": 1,
        "features": {"reports": True, "multi_user": False, "export": True}
    },
    {
        "code": "pro",
        "name": "Pro",
        "description": "For growing businesses",
        "price_monthly": 199.0,
        "currency": "ETB",
        "max_products": None,
        "max_invoices": None,
        "max_users": None,  # Unlimited
        "max_branches": None,  # Unlimited
        "features": {"reports": True, "multi_user": True, "export": True, "analytics": True}
    },
    {
        "code": "enterprise",
        "name": "Enterprise",
        "description": "Custom plans for large businesses",
        "price_monthly": 0.0,  # Custom pricing
        "currency": "ETB",
        "max_products": None,
        "max_invoices": None,
        "max_users": None,
        "max_branches": None,
        "features": {"reports": True, "multi_user": True, "export": True, "analytics": True, "priority_support": True}
    },
]


def initialize_default_plans(session: Session):
    """Initialize default subscription plans if they don't exist"""
    for plan_data in DEFAULT_PLANS:
        existing = session.exec(select(SubscriptionPlan).where(SubscriptionPlan.code == plan_data["code"])).first()
        if not existing:
            plan = SubscriptionPlan(**plan_data)
            session.add(plan)
    session.commit()


def create_trial_subscription(session: Session, user_id: int) -> UserSubscription:
    """Create a free trial subscription for a new user"""
    # Get free trial plan
    trial_plan = session.exec(select(SubscriptionPlan).where(SubscriptionPlan.code == "free_trial")).first()
    if not trial_plan:
        initialize_default_plans(session)
        trial_plan = session.exec(select(SubscriptionPlan).where(SubscriptionPlan.code == "free_trial")).first()
    
    expires_at = datetime.utcnow() + timedelta(days=14)
    
    subscription = UserSubscription(
        user_id=user_id,
        plan_code=trial_plan.code,
        status="trial",
        expires_at=expires_at,
        auto_renew=False
    )
    session.add(subscription)
    session.commit()
    session.refresh(subscription)
    return subscription


def get_user_subscription(session: Session, user_id: int) -> Optional[UserSubscription]:
    """Get the current active subscription for a user"""
    statement = select(UserSubscription).where(
        UserSubscription.user_id == user_id
    ).order_by(UserSubscription.created_at.desc())
    return session.exec(statement).first()


def has_active_subscription(session: Session, user_id: int) -> bool:
    """Check if user has an active subscription"""
    subscription = get_user_subscription(session, user_id)
    if not subscription:
        return False
    
    if subscription.status not in ["trial", "active"]:
        return False
    
    if subscription.expires_at and subscription.expires_at < datetime.utcnow():
        # Auto-expire if past expiry date
        subscription.status = "expired"
        session.add(subscription)
        session.commit()
        return False
    
    return True


def activate_subscription(
    session: Session,
    user_id: int,
    plan_code: str,
    payment_provider: str,
    transaction_reference: str,
    billing_cycle: str = "monthly"
) -> UserSubscription:
    """Activate a subscription after successful payment"""
    # Get or create subscription
    subscription = get_user_subscription(session, user_id)
    
    if not subscription:
        subscription = UserSubscription(user_id=user_id, plan_code=plan_code)
    
    # Calculate expiry date
    started_at = datetime.utcnow()
    if billing_cycle == "yearly":
        expires_at = started_at + timedelta(days=365)
        next_billing = started_at + timedelta(days=365)
    else:
        expires_at = started_at + timedelta(days=30)
        next_billing = started_at + timedelta(days=30)
    
    subscription.plan_code = plan_code
    subscription.status = "active"
    subscription.started_at = started_at
    subscription.expires_at = expires_at
    subscription.next_billing_date = next_billing
    subscription.payment_provider = payment_provider
    subscription.transaction_reference = transaction_reference
    subscription.last_payment_date = started_at
    subscription.billing_cycle = billing_cycle
    subscription.auto_renew = True
    subscription.updated_at = datetime.utcnow()
    
    session.add(subscription)
    session.commit()
    session.refresh(subscription)
    
    # Create payment transaction record
    plan = session.exec(select(SubscriptionPlan).where(SubscriptionPlan.code == plan_code)).first()
    if plan:
        transaction = PaymentTransaction(
            user_id=user_id,
            subscription_id=subscription.id,
            amount=plan.price_monthly if billing_cycle == "monthly" else (plan.price_yearly or plan.price_monthly * 12),
            currency=plan.currency,
            payment_provider=payment_provider,
            transaction_reference=transaction_reference,
            status="completed",
            completed_at=started_at
        )
        session.add(transaction)
        session.commit()
    
    return subscription


def cancel_subscription(session: Session, user_id: int) -> UserSubscription:
    """Cancel a subscription (no refund, expires at end of period)"""
    subscription = get_user_subscription(session, user_id)
    if not subscription:
        raise ValueError("No active subscription found")
    
    subscription.status = "cancelled"
    subscription.cancelled_at = datetime.utcnow()
    subscription.auto_renew = False
    subscription.updated_at = datetime.utcnow()
    
    session.add(subscription)
    session.commit()
    session.refresh(subscription)
    return subscription


def expire_subscriptions(session: Session):
    """Daily cron job: Expire subscriptions that have passed their expiry date"""
    now = datetime.utcnow()
    statement = select(UserSubscription).where(
        UserSubscription.status.in_(["trial", "active"]),
        UserSubscription.expires_at <= now
    )
    expired = session.exec(statement).all()
    
    for subscription in expired:
        subscription.status = "expired"
        subscription.updated_at = now
        session.add(subscription)
    
    session.commit()
    return len(expired)


def get_subscription_plan(session: Session, plan_code: str) -> Optional[SubscriptionPlan]:
    """Get a subscription plan by code"""
    return session.exec(select(SubscriptionPlan).where(SubscriptionPlan.code == plan_code)).first()


def check_subscription_limit(session: Session, user_id: int, limit_type: str) -> tuple[bool, Optional[int]]:
    """
    Check if user has reached a subscription limit
    
    Returns:
        (has_limit, max_allowed) - has_limit is True if limit exists, max_allowed is None for unlimited
    """
    subscription = get_user_subscription(session, user_id)
    if not subscription:
        return (True, 0)  # No subscription = no access
    
    plan = get_subscription_plan(session, subscription.plan_code)
    if not plan:
        return (True, 0)
    
    if limit_type == "products":
        return (plan.max_products is not None, plan.max_products)
    elif limit_type == "invoices":
        return (plan.max_invoices is not None, plan.max_invoices)
    elif limit_type == "users":
        return (plan.max_users is not None, plan.max_users)
    elif limit_type == "branches":
        return (plan.max_branches is not None, plan.max_branches)
    
    return (False, None)


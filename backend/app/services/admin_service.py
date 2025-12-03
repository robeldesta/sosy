"""
Admin service for business and system management
"""
from sqlmodel import Session, select, func
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from app.models.user import User
from app.models.business import Business
from app.models.subscription import UserSubscription
from app.models.admin_log import AdminLog
from app.models.sync_error import SyncError
from app.models.business_metrics import BusinessMetricsDaily


def log_admin_action(
    session: Session,
    admin_id: int,
    action: str,
    entity_type: Optional[str] = None,
    entity_id: Optional[int] = None,
    before_json: Optional[str] = None,
    after_json: Optional[str] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None
) -> AdminLog:
    """Log an admin action for audit trail"""
    import json
    
    log = AdminLog(
        admin_id=admin_id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        before_json=json.dumps(before_json) if before_json else None,
        after_json=json.dumps(after_json) if after_json else None,
        ip_address=ip_address,
        user_agent=user_agent
    )
    
    session.add(log)
    session.commit()
    session.refresh(log)
    
    return log


def suspend_business(
    session: Session,
    admin_id: int,
    business_id: int,
    reason: Optional[str] = None,
    ip_address: Optional[str] = None
) -> Business:
    """Suspend a business"""
    business = session.get(Business, business_id)
    if not business:
        raise ValueError("Business not found")
    
    before_state = {"subscription_status": business.user.subscription_status if business.user else None}
    
    # Update user subscription to expired
    if business.user:
        business.user.subscription_status = "expired"
        session.add(business.user)
    
    after_state = {"subscription_status": "expired"}
    
    log_admin_action(
        session,
        admin_id,
        "suspend_business",
        "business",
        business_id,
        before_state,
        after_state,
        ip_address
    )
    
    session.commit()
    session.refresh(business)
    
    return business


def upgrade_business_plan(
    session: Session,
    admin_id: int,
    business_id: int,
    plan: str,
    months: int,
    ip_address: Optional[str] = None
) -> Business:
    """Upgrade business subscription plan"""
    business = session.get(Business, business_id)
    if not business:
        raise ValueError("Business not found")
    
    if not business.user:
        raise ValueError("Business has no associated user")
    
    before_state = {"subscription_status": business.user.subscription_status}
    
    # Update subscription
    from app.services.subscription_service import create_trial_subscription, activate_subscription
    
    # Get or create subscription
    subscription_statement = select(UserSubscription).where(
        UserSubscription.user_id == business.user.id
    ).order_by(UserSubscription.created_at.desc())
    subscription = session.exec(subscription_statement).first()
    
    if not subscription:
        # Create new subscription
        expires_at = datetime.utcnow() + timedelta(days=months * 30)
        subscription = UserSubscription(
            user_id=business.user.id,
            plan_code=plan,
            status="active",
            started_at=datetime.utcnow(),
            expires_at=expires_at
        )
        session.add(subscription)
    else:
        # Update existing subscription
        subscription.plan_code = plan
        subscription.status = "active"
        if subscription.expires_at:
            subscription.expires_at = subscription.expires_at + timedelta(days=months * 30)
        else:
            subscription.expires_at = datetime.utcnow() + timedelta(days=months * 30)
        session.add(subscription)
    
    session.commit()
    session.refresh(subscription)
    
    after_state = {
        "subscription_status": subscription.status,
        "plan": subscription.plan_code,
        "expires_at": subscription.expires_at.isoformat() if subscription.expires_at else None
    }
    
    log_admin_action(
        session,
        admin_id,
        "upgrade_plan",
        "subscription",
        subscription.id if subscription else None,
        before_state,
        after_state,
        ip_address
    )
    
    session.commit()
    session.refresh(business)
    
    return business


def get_system_stats(session: Session) -> Dict[str, Any]:
    """Get system-wide statistics"""
    # Total businesses
    total_businesses = session.exec(select(func.count(Business.id))).first() or 0
    
    # Active users today
    today = datetime.utcnow().date()
    active_users_today = session.exec(
        select(func.count(func.distinct(User.id)))
        .where(User.last_login_at >= datetime.combine(today, datetime.min.time()))
    ).first() or 0
    
    # Total invoices last 24h
    from app.models.invoice import Invoice
    last_24h = datetime.utcnow() - timedelta(hours=24)
    invoices_24h = session.exec(
        select(func.count(Invoice.id))
        .where(Invoice.created_at >= last_24h)
    ).first() or 0
    
    # Total sync errors last 24h
    sync_errors_24h = session.exec(
        select(func.count(SyncError.id))
        .where(SyncError.created_at >= last_24h, SyncError.resolved == False)
    ).first() or 0
    
    # Subscription revenue (MRR)
    from app.models.subscription import UserSubscription
    active_subscriptions = session.exec(
        select(UserSubscription)
        .where(UserSubscription.status == "active")
    ).all()
    
    mrr = sum(
        get_plan_price(sub.plan) for sub in active_subscriptions
    )
    
    return {
        "total_businesses": total_businesses,
        "active_users_today": active_users_today,
        "invoices_24h": invoices_24h,
        "sync_errors_24h": sync_errors_24h,
        "mrr": mrr,
        "arr": mrr * 12,
    }


def get_plan_price(plan: str) -> float:
    """Get monthly price for plan"""
    prices = {
        "free": 0.0,
        "basic": 99.0,
        "pro": 199.0,
        "enterprise": 0.0,  # Custom pricing
    }
    return prices.get(plan, 0.0)


def get_business_metrics(
    session: Session,
    business_id: int,
    days: int = 30
) -> List[BusinessMetricsDaily]:
    """Get business metrics for date range"""
    start_date = datetime.utcnow().date() - timedelta(days=days)
    
    statement = select(BusinessMetricsDaily).where(
        BusinessMetricsDaily.business_id == business_id,
        BusinessMetricsDaily.metric_date >= start_date
    ).order_by(BusinessMetricsDaily.metric_date.desc())
    
    return list(session.exec(statement).all())


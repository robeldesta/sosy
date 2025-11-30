"""
Subscription models for billing and access control
"""
from sqlmodel import SQLModel, Field, Relationship, Column, JSON
from typing import Optional
from datetime import datetime, timedelta


class SubscriptionPlan(SQLModel, table=True):
    """Subscription plan definitions"""
    id: Optional[int] = Field(default=None, primary_key=True)
    code: str = Field(unique=True, index=True)  # free_trial, basic, pro, enterprise
    name: str  # "Free Trial", "Basic", "Pro", "Enterprise"
    description: Optional[str] = None
    price_monthly: float = Field(default=0.0)  # Price in ETB
    price_yearly: Optional[float] = None  # Optional yearly price
    currency: str = Field(default="ETB")  # ETB or USD
    max_products: Optional[int] = None  # None = unlimited
    max_invoices: Optional[int] = None  # None = unlimited
    max_users: int = Field(default=1)  # Number of staff users allowed
    max_branches: int = Field(default=1)  # Number of branches allowed
    features: Optional[dict] = Field(default=None, sa_column=Column(JSON))  # Feature flags
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class UserSubscription(SQLModel, table=True):
    """User subscription tracking"""
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", index=True)
    plan_code: str = Field(index=True)  # Reference to SubscriptionPlan.code
    status: str = Field(default="trial")  # trial, active, expired, cancelled, payment_failed
    started_at: datetime = Field(default_factory=datetime.utcnow)
    expires_at: Optional[datetime] = None
    cancelled_at: Optional[datetime] = None
    payment_provider: Optional[str] = None  # telebirr, chapa, paypal
    transaction_reference: Optional[str] = None  # Payment transaction ID
    last_payment_date: Optional[datetime] = None
    next_billing_date: Optional[datetime] = None
    billing_cycle: str = Field(default="monthly")  # monthly, yearly
    auto_renew: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    user: Optional["User"] = Relationship()


class PaymentTransaction(SQLModel, table=True):
    """Payment transaction history"""
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", index=True)
    subscription_id: Optional[int] = Field(default=None, foreign_key="usersubscription.id")
    amount: float
    currency: str = Field(default="ETB")
    payment_provider: str  # telebirr, chapa, paypal
    transaction_reference: str = Field(unique=True, index=True)
    status: str = Field(default="pending")  # pending, completed, failed, refunded
    payment_method: Optional[str] = None  # card, mobile_money, bank_transfer
    payment_metadata: Optional[dict] = Field(default=None, sa_column=Column(JSON))
    created_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = None
    
    user: Optional["User"] = Relationship()


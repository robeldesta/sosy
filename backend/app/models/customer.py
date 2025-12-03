"""
Customer models for credit management and loyalty
"""
from sqlmodel import SQLModel, Field, Relationship
from typing import Optional, List, TYPE_CHECKING
from datetime import datetime

if TYPE_CHECKING:
    from app.models.business import Business
    from app.models.customer_credit import CustomerCreditEntry
    from app.models.customer_loyalty import CustomerLoyaltyEntry


class Customer(SQLModel, table=True):
    """Customer account with credit tracking"""
    id: Optional[int] = Field(default=None, primary_key=True)
    business_id: int = Field(foreign_key="business.id", index=True)
    branch_id: Optional[int] = Field(default=None, foreign_key="branch.id", index=True)
    
    # Customer info
    name: str = Field(index=True)
    phone: Optional[str] = Field(default=None, index=True)
    telegram_user_id: Optional[int] = Field(default=None, index=True)
    email: Optional[str] = None
    address: Optional[str] = None
    notes: Optional[str] = None
    
    # Credit tracking
    total_credit: float = Field(default=0.0)  # Total credit given
    total_paid: float = Field(default=0.0)  # Total payments received
    balance: float = Field(default=0.0, index=True)  # Outstanding balance (total_credit - total_paid)
    
    # Loyalty
    loyalty_points: float = Field(default=0.0)  # Total loyalty points
    
    # Status
    is_active: bool = Field(default=True)
    is_settled: bool = Field(default=True)  # True if balance is 0
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    last_payment_at: Optional[datetime] = None
    last_sale_at: Optional[datetime] = None
    
    # Relationships
    business: Optional["Business"] = Relationship()
    credit_entries: List["CustomerCreditEntry"] = Relationship(back_populates="customer")
    loyalty_entries: List["CustomerLoyaltyEntry"] = Relationship(back_populates="customer")


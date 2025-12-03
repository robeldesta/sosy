"""
Customer loyalty points tracking
"""
from sqlmodel import SQLModel, Field, Relationship
from typing import Optional, TYPE_CHECKING
from datetime import datetime

if TYPE_CHECKING:
    from app.models.customer import Customer
    from app.models.pos import Sale
    from app.models.invoice import Invoice


class CustomerLoyaltyEntry(SQLModel, table=True):
    """Loyalty points entry (earned or redeemed)"""
    id: Optional[int] = Field(default=None, primary_key=True)
    customer_id: int = Field(foreign_key="customer.id", index=True)
    business_id: int = Field(foreign_key="business.id", index=True)
    
    # Reference to sale/invoice
    sale_id: Optional[int] = Field(default=None, foreign_key="sale.id")
    invoice_id: Optional[int] = Field(default=None, foreign_key="invoice.id")
    
    # Entry details
    entry_type: str = Field(index=True)  # "earned" or "redeemed"
    points: float
    points_after: float  # Customer points balance after this entry
    
    # For redemption
    redemption_type: Optional[str] = None  # discount, free_item, store_credit
    redemption_value: Optional[float] = None  # Value of redemption
    
    # Notes
    notes: Optional[str] = None
    
    # Created by
    created_by: Optional[int] = Field(default=None, foreign_key="user.id")
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow, index=True)
    
    # Relationships
    customer: Optional["Customer"] = Relationship(back_populates="loyalty_entries")


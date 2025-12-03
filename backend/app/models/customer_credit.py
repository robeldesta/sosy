"""
Customer credit entry models for ledger tracking
"""
from sqlmodel import SQLModel, Field, Relationship
from typing import Optional, TYPE_CHECKING
from datetime import datetime

if TYPE_CHECKING:
    from app.models.customer import Customer
    from app.models.invoice import Invoice
    from app.models.pos import Sale


class CustomerCreditEntry(SQLModel, table=True):
    """Credit ledger entry (credit sale or payment)"""
    id: Optional[int] = Field(default=None, primary_key=True)
    customer_id: int = Field(foreign_key="customer.id", index=True)
    business_id: int = Field(foreign_key="business.id", index=True)
    
    # Reference to sale/invoice/payment
    sale_id: Optional[int] = Field(default=None, foreign_key="sale.id")
    invoice_id: Optional[int] = Field(default=None, foreign_key="invoice.id")
    payment_id: Optional[int] = Field(default=None, foreign_key="payment.id")
    
    # Entry details
    entry_type: str = Field(index=True)  # "credit" or "payment"
    amount: float
    balance_after: float  # Customer balance after this entry
    
    # Payment method (for payment entries)
    payment_method: Optional[str] = None  # cash, mobile_money, bank, etc.
    
    # Notes
    notes: Optional[str] = None
    reference: Optional[str] = None  # Invoice number, receipt number, etc.
    
    # Created by
    created_by: Optional[int] = Field(default=None, foreign_key="user.id")
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow, index=True)
    
    # Relationships
    customer: Optional["Customer"] = Relationship(back_populates="credit_entries")


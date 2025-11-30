"""
Payment model for invoice payments
"""
from sqlmodel import SQLModel, Field, Relationship
from typing import Optional
from datetime import datetime
from app.models.invoice import Invoice
from app.models.user import User


class Payment(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    invoice_id: int = Field(foreign_key="invoice.id", index=True)
    amount: float
    payment_method: str = Field(default="cash")  # cash, telebirr, bank, other
    bank_name: Optional[str] = None  # CBE, Awash, Dashen, Abyssinia, etc.
    payment_date: datetime = Field(default_factory=datetime.utcnow)
    notes: Optional[str] = None
    created_by: Optional[int] = Field(default=None, foreign_key="user.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    invoice: Optional[Invoice] = Relationship()
    user: Optional[User] = Relationship()


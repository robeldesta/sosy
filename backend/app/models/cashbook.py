"""
Cashbook entry model for cash reconciliation
"""
from sqlmodel import SQLModel, Field, Relationship
from typing import Optional
from datetime import datetime
from app.models.business import Business
from app.models.user import User


class CashbookEntry(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    business_id: int = Field(foreign_key="business.id", index=True)
    entry_type: str  # payment_in, expense_out, adjustment
    amount: float
    payment_method: Optional[str] = None  # cash, telebirr, bank
    reference_id: Optional[int] = None  # invoice_id, expense_id, etc.
    reference_type: Optional[str] = None  # invoice, expense, adjustment
    description: str
    entry_date: datetime = Field(default_factory=datetime.utcnow, index=True)
    created_by: Optional[int] = Field(default=None, foreign_key="user.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    business: Optional[Business] = Relationship()
    user: Optional[User] = Relationship()


class CashReconciliation(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    business_id: int = Field(foreign_key="business.id", index=True)
    reconciliation_date: datetime = Field(default_factory=datetime.utcnow, index=True)
    expected_cash: float  # Calculated from transactions
    actual_cash: float  # Entered by user
    difference: float  # actual - expected
    adjustment_amount: float  # Adjustment entry amount
    adjustment_reason: Optional[str] = None
    notes: Optional[str] = None
    reconciled_by: Optional[int] = Field(default=None, foreign_key="user.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    business: Optional[Business] = Relationship()
    user: Optional[User] = Relationship()


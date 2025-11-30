"""
Expense model for cash out tracking
"""
from sqlmodel import SQLModel, Field, Relationship
from typing import Optional
from datetime import datetime
from app.models.business import Business
from app.models.user import User


class ExpenseCategory(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    business_id: int = Field(foreign_key="business.id", index=True)
    name: str  # Fuel, Rent, Purchase, Staff, Misc, etc.
    description: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    business: Optional[Business] = Relationship()


class Expense(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    business_id: int = Field(foreign_key="business.id", index=True)
    category_id: Optional[int] = Field(default=None, foreign_key="expensecategory.id")
    amount: float
    description: str
    expense_date: datetime = Field(default_factory=datetime.utcnow)
    payment_method: str = Field(default="cash")  # cash, telebirr, bank
    receipt_photo_url: Optional[str] = None  # Telegram file URL
    notes: Optional[str] = None
    created_by: Optional[int] = Field(default=None, foreign_key="user.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    business: Optional[Business] = Relationship()
    category: Optional[ExpenseCategory] = Relationship()
    user: Optional[User] = Relationship()


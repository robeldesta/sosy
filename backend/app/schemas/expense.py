"""
Expense schemas
"""
from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class ExpenseCategoryCreate(BaseModel):
    name: str
    description: Optional[str] = None


class ExpenseCategoryResponse(BaseModel):
    id: int
    business_id: int
    name: str
    description: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


class ExpenseCreate(BaseModel):
    category_id: Optional[int] = None
    amount: float
    description: str
    expense_date: Optional[datetime] = None
    payment_method: str = "cash"
    receipt_photo_url: Optional[str] = None
    notes: Optional[str] = None


class ExpenseResponse(BaseModel):
    id: int
    business_id: int
    category_id: Optional[int] = None
    amount: float
    description: str
    expense_date: datetime
    payment_method: str
    receipt_photo_url: Optional[str] = None
    notes: Optional[str] = None
    created_by: Optional[int] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


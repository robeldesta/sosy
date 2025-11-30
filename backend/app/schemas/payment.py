"""
Payment schemas
"""
from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class PaymentCreate(BaseModel):
    invoice_id: int
    amount: float
    payment_method: str = "cash"  # cash, telebirr, bank, other
    bank_name: Optional[str] = None
    payment_date: Optional[datetime] = None
    notes: Optional[str] = None


class PaymentResponse(BaseModel):
    id: int
    invoice_id: int
    amount: float
    payment_method: str
    bank_name: Optional[str] = None
    payment_date: datetime
    notes: Optional[str] = None
    created_by: Optional[int] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


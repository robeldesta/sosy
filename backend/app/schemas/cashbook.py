"""
Cashbook schemas
"""
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class CashbookEntryResponse(BaseModel):
    id: int
    business_id: int
    entry_type: str
    amount: float
    payment_method: Optional[str] = None
    reference_id: Optional[int] = None
    reference_type: Optional[str] = None
    description: str
    entry_date: datetime
    created_by: Optional[int] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


class CashReconciliationCreate(BaseModel):
    reconciliation_date: Optional[datetime] = None
    actual_cash: float
    adjustment_reason: Optional[str] = None
    notes: Optional[str] = None


class CashReconciliationResponse(BaseModel):
    id: int
    business_id: int
    reconciliation_date: datetime
    expected_cash: float
    actual_cash: float
    difference: float
    adjustment_amount: float
    adjustment_reason: Optional[str] = None
    notes: Optional[str] = None
    reconciled_by: Optional[int] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


class CashbookSummary(BaseModel):
    date: str
    cash_in: float
    cash_out: float
    net_cash: float
    cash_by_method: dict  # {"cash": 100, "telebirr": 50, "bank": 200}
    entries: List["CashbookEntryResponse"]
    
    class Config:
        from_attributes = True


"""
Customer schemas for API requests/responses
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class CustomerBase(BaseModel):
    name: str
    phone: Optional[str] = None
    telegram_user_id: Optional[int] = None
    email: Optional[str] = None
    address: Optional[str] = None
    notes: Optional[str] = None


class CustomerCreate(CustomerBase):
    pass


class CustomerUpdate(CustomerBase):
    name: Optional[str] = None


class CustomerResponse(CustomerBase):
    id: int
    business_id: int
    branch_id: Optional[int] = None
    total_credit: float
    total_paid: float
    balance: float
    loyalty_points: float
    is_active: bool
    is_settled: bool
    created_at: datetime
    updated_at: datetime
    last_payment_at: Optional[datetime] = None
    last_sale_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class CreditEntryCreate(BaseModel):
    customer_id: int
    amount: float
    sale_id: Optional[int] = None
    invoice_id: Optional[int] = None
    reference: Optional[str] = None
    notes: Optional[str] = None


class PaymentEntryCreate(BaseModel):
    customer_id: int
    amount: float
    payment_method: str = "cash"  # cash, mobile_money, bank, etc.
    reference: Optional[str] = None
    notes: Optional[str] = None


class CreditEntryResponse(BaseModel):
    id: int
    customer_id: int
    entry_type: str  # "credit" or "payment"
    amount: float
    balance_after: float
    payment_method: Optional[str] = None
    reference: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


class CustomerLedgerResponse(BaseModel):
    customer: CustomerResponse
    entries: List[CreditEntryResponse]
    current_balance: float


class AgingBucket(BaseModel):
    bucket: str  # "0-7", "8-30", "31-60", "60+"
    count: int
    total_amount: float
    customers: List[CustomerResponse]


class AgingReportResponse(BaseModel):
    total_outstanding: float
    buckets: List[AgingBucket]


class LoyaltyEntryCreate(BaseModel):
    customer_id: int
    entry_type: str  # "earned" or "redeemed"
    points: float
    sale_id: Optional[int] = None
    invoice_id: Optional[int] = None
    redemption_type: Optional[str] = None
    redemption_value: Optional[float] = None
    notes: Optional[str] = None


class LoyaltyEntryResponse(BaseModel):
    id: int
    customer_id: int
    entry_type: str
    points: float
    points_after: float
    redemption_type: Optional[str] = None
    redemption_value: Optional[float] = None
    notes: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


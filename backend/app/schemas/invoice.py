from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class InvoiceItemBase(BaseModel):
    stock_item_id: int
    quantity: int
    unit_price: float


class InvoiceItemResponse(BaseModel):
    id: int
    invoice_id: int
    stock_item_id: int
    quantity: int
    unit_price: float
    total: float
    
    class Config:
        from_attributes = True


class InvoiceBase(BaseModel):
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    items: List[InvoiceItemBase]
    discount: Optional[float] = 0.0
    payment_mode: Optional[str] = "cash"  # cash, credit
    template: Optional[str] = "simple"  # simple, modern, blue


class InvoiceResponse(BaseModel):
    id: int
    business_id: int
    invoice_number: str
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    items: List[InvoiceItemResponse]
    subtotal: float
    discount: float
    tax: float
    total: float
    status: str
    payment_mode: str
    template: str
    created_at: datetime
    updated_at: datetime
    created_by: Optional[int] = None
    updated_by: Optional[int] = None
    
    class Config:
        from_attributes = True


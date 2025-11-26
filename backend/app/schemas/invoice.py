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


class InvoiceCreate(InvoiceBase):
    pass


class InvoiceResponse(BaseModel):
    id: int
    business_id: int
    invoice_number: str
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    items: List[InvoiceItemResponse]
    subtotal: float
    tax: float
    total: float
    status: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


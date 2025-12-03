"""
POS schemas for request/response validation
"""
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class SaleItemCreate(BaseModel):
    product_id: int
    quantity: int
    unit_price: float


class CartItem(BaseModel):
    product_id: int
    product_name: str
    quantity: int
    unit_price: float
    subtotal: float
    stock_available: int


class CartUpdateRequest(BaseModel):
    items: List[SaleItemCreate]


class CheckoutRequest(BaseModel):
    items: List[SaleItemCreate]
    payment_method: str  # cash, mobile_money, card, credit
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    customer_id: Optional[int] = None  # Required if payment_method is "credit"
    discount: float = 0.0
    notes: Optional[str] = None


class SaleItemResponse(BaseModel):
    id: int
    product_id: int
    product_name: str
    quantity: int
    unit_price: float
    subtotal: float

    class Config:
        from_attributes = True


class SaleResponse(BaseModel):
    id: int
    total: float
    subtotal: float
    discount: float
    tax: float
    payment_method: str
    payment_status: str
    customer_name: Optional[str]
    customer_phone: Optional[str]
    created_at: datetime
    items: List[SaleItemResponse]

    class Config:
        from_attributes = True


class POSSessionResponse(BaseModel):
    id: int
    opened_at: datetime
    closed_at: Optional[datetime]
    total_sales: float
    total_transactions: int
    cash_total: float
    mobile_money_total: float
    card_total: float
    credit_total: float
    is_active: bool

    class Config:
        from_attributes = True


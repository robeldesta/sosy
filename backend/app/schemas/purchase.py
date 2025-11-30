from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime


class PurchaseItemBase(BaseModel):
    product_id: int
    quantity: float
    unit_cost: float


class PurchaseItemCreate(PurchaseItemBase):
    pass


class PurchaseItemResponse(PurchaseItemBase):
    id: int
    purchase_id: int
    total: float

    class Config:
        from_attributes = True


class PurchaseBase(BaseModel):
    supplier_id: int
    date: Optional[datetime] = None
    notes: Optional[str] = None
    status: Optional[str] = "draft"


class PurchaseCreate(PurchaseBase):
    items: List[PurchaseItemCreate]


class PurchaseResponse(PurchaseBase):
    id: int
    business_id: int
    purchase_number: str
    subtotal: float
    tax: float
    total: float
    created_at: datetime
    updated_at: datetime
    items: List[PurchaseItemResponse] = []

    class Config:
        from_attributes = True



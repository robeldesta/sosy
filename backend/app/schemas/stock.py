from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class StockItemBase(BaseModel):
    name: str
    description: Optional[str] = None
    quantity: int
    unit_price: float
    category: Optional[str] = None


class StockItemCreate(StockItemBase):
    pass


class StockItemResponse(StockItemBase):
    id: int
    business_id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


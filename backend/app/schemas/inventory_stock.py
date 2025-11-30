from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class StockItemBase(BaseModel):
    product_id: int
    quantity: float = 0.0
    location: str = "main"


class StockItemCreate(StockItemBase):
    pass


class StockItemResponse(StockItemBase):
    id: int
    last_updated: datetime
    
    class Config:
        from_attributes = True


class StockItemWithProduct(StockItemResponse):
    product_name: str
    product_sku: Optional[str] = None
    unit_of_measure: str
    
    class Config:
        from_attributes = True


class StockAdjustmentRequest(BaseModel):
    adjustment: float  # Positive for increase, negative for decrease
    reference: Optional[str] = None

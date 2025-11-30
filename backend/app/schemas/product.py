from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class ProductBase(BaseModel):
    name: str
    sku: Optional[str] = None
    category: Optional[str] = None
    unit_of_measure: str = "pcs"
    buying_price: float
    selling_price: float
    low_stock_threshold: Optional[float] = None
    is_active: bool = True


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    sku: Optional[str] = None
    category: Optional[str] = None
    unit_of_measure: Optional[str] = None
    buying_price: Optional[float] = None
    selling_price: Optional[float] = None
    low_stock_threshold: Optional[float] = None
    is_active: Optional[bool] = None


class ProductResponse(ProductBase):
    id: int
    business_id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True



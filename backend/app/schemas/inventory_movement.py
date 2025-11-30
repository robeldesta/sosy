from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class InventoryMovementBase(BaseModel):
    product_id: int
    movement_type: str  # purchase_add, sale, adjustment_up, adjustment_down, return_in, return_out
    quantity: float
    reference: Optional[str] = None


class InventoryMovementCreate(InventoryMovementBase):
    pass


class InventoryMovementResponse(InventoryMovementBase):
    id: int
    created_at: datetime
    user_id: Optional[int] = None
    
    class Config:
        from_attributes = True


class InventoryMovementWithProduct(InventoryMovementResponse):
    product_name: str
    product_sku: Optional[str] = None
    
    class Config:
        from_attributes = True



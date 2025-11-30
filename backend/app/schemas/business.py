from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class BusinessBase(BaseModel):
    name: str
    business_type: Optional[str] = None
    location: Optional[str] = None
    currency: Optional[str] = "ETB"
    tax_type: Optional[str] = None
    tax_id: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None


class BusinessCreate(BusinessBase):
    pass


class BusinessUpdate(BaseModel):
    name: Optional[str] = None
    business_type: Optional[str] = None
    location: Optional[str] = None
    currency: Optional[str] = None
    tax_type: Optional[str] = None
    tax_id: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None


class BusinessResponse(BusinessBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

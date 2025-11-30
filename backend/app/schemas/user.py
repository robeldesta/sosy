from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class UserBase(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    username: Optional[str] = None
    phone: Optional[str] = None
    language: Optional[str] = "en"
    role: Optional[str] = "owner"  # owner, staff


class UserUpdate(UserBase):
    pass


class UserResponse(UserBase):
    id: int
    telegram_id: int
    photo_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


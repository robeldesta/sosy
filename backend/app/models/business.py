from sqlmodel import SQLModel, Field, Relationship
from typing import Optional
from datetime import datetime
from app.models.user import User


class Business(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id")
    name: str
    tax_id: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    allow_staff_stock_adjustments: bool = Field(default=False)  # Allow staff to adjust stock
    show_sensitive_data: bool = Field(default=True)  # Owner toggle for sensitive data mode
    invoice_template: Optional[str] = Field(default="simple")  # simple, modern, blue
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    user: Optional[User] = Relationship(sa_relationship_kwargs={"foreign_keys": "[Business.user_id]"})


from sqlmodel import SQLModel, Field, Relationship
from typing import Optional
from datetime import datetime
from app.models.business import Business


class LegacyStockItem(SQLModel, table=True):
    __tablename__ = "legacy_stock_item"
    id: Optional[int] = Field(default=None, primary_key=True)
    business_id: int = Field(foreign_key="business.id")
    name: str
    description: Optional[str] = None
    quantity: int = Field(default=0)
    unit_price: float
    category: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    business: Optional[Business] = Relationship()

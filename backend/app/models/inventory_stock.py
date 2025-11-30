from sqlmodel import SQLModel, Field, Relationship
from typing import Optional, TYPE_CHECKING
from datetime import datetime

if TYPE_CHECKING:
    from app.models.product import Product


class StockItem(SQLModel, table=True):
    __tablename__ = "stockitem"
    id: Optional[int] = Field(default=None, primary_key=True)
    product_id: int = Field(foreign_key="product.id", index=True)
    quantity: float = Field(default=0.0)
    location: str = Field(default="main")
    last_updated: datetime = Field(default_factory=datetime.utcnow)
    
    product: Optional["Product"] = Relationship(back_populates="stock_items")


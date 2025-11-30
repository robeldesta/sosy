from sqlmodel import SQLModel, Field, Relationship
from typing import Optional, TYPE_CHECKING
from app.models.product import Product

if TYPE_CHECKING:
    from app.models.purchase import Purchase


class PurchaseItem(SQLModel, table=True):
    __tablename__ = "purchaseitem"
    id: Optional[int] = Field(default=None, primary_key=True)
    purchase_id: int = Field(foreign_key="purchase.id")
    product_id: int = Field(foreign_key="product.id")
    quantity: float
    unit_cost: float
    total: float
    
    purchase: Optional["Purchase"] = Relationship(back_populates="items")
    product: Optional[Product] = Relationship()



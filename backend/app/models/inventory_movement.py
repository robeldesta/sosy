from sqlmodel import SQLModel, Field, Relationship
from typing import Optional, TYPE_CHECKING
from datetime import datetime

if TYPE_CHECKING:
    from app.models.product import Product
    from app.models.user import User


class InventoryMovement(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    product_id: int = Field(foreign_key="product.id", index=True)
    branch_id: Optional[int] = Field(default=None, foreign_key="branch.id", index=True)  # Multi-branch support
    movement_type: str  # purchase_add, sale, adjustment_up, adjustment_down, return_in, return_out
    quantity: float
    reference: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    user_id: Optional[int] = Field(default=None, foreign_key="user.id")
    
    product: Optional["Product"] = Relationship(back_populates="movements")
    user: Optional["User"] = Relationship()


from sqlmodel import SQLModel, Field, Relationship
from typing import Optional, List, TYPE_CHECKING
from datetime import datetime
from app.models.business import Business
from app.models.supplier import Supplier
from app.models.product import Product

if TYPE_CHECKING:
    from app.models.purchase_item import PurchaseItem


class Purchase(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    business_id: int = Field(foreign_key="business.id", index=True)
    branch_id: Optional[int] = Field(default=None, foreign_key="branch.id", index=True)  # Multi-branch support
    supplier_id: int = Field(foreign_key="supplier.id", index=True)
    purchase_number: str = Field(unique=True, index=True)
    date: datetime = Field(default_factory=datetime.utcnow)
    subtotal: float
    tax: float = Field(default=0.0)
    total: float
    status: str = Field(default="draft")  # draft, received
    notes: Optional[str] = None
    created_by: Optional[int] = Field(default=None, foreign_key="user.id")  # User who created
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    business: Optional[Business] = Relationship()
    supplier: Optional[Supplier] = Relationship(back_populates="purchases")
    items: List["PurchaseItem"] = Relationship(back_populates="purchase")


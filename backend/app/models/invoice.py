from sqlmodel import SQLModel, Field, Relationship
from typing import Optional, List, TYPE_CHECKING
from datetime import datetime
from app.models.business import Business

if TYPE_CHECKING:
    from app.models.payment import Payment


class InvoiceItem(SQLModel, table=True):
    __tablename__ = "invoiceitem"
    id: Optional[int] = Field(default=None, primary_key=True)
    invoice_id: int = Field(foreign_key="invoice.id")
    stock_item_id: int = Field(foreign_key="legacy_stock_item.id")
    quantity: int
    unit_price: float
    total: float
    
    invoice: Optional["Invoice"] = Relationship(back_populates="items")


class Invoice(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    business_id: int = Field(foreign_key="business.id")
    branch_id: Optional[int] = Field(default=None, foreign_key="branch.id", index=True)  # Multi-branch support
    invoice_number: str = Field(unique=True, index=True)
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    subtotal: float
    discount: float = Field(default=0.0)
    tax: float = Field(default=0.0)
    total: float
    status: str = Field(default="draft")  # draft, sent, unpaid, partial, paid, cancelled
    payment_mode: str = Field(default="cash")  # cash, credit
    template: str = Field(default="simple")  # simple, modern, blue
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    created_by: Optional[int] = Field(default=None, foreign_key="user.id")  # User ID
    updated_by: Optional[int] = Field(default=None, foreign_key="user.id")  # User ID
    
    business: Optional[Business] = Relationship()
    items: List[InvoiceItem] = Relationship(back_populates="invoice")
    payments: List["Payment"] = Relationship()  # Multiple payments per invoice


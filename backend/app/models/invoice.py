from sqlmodel import SQLModel, Field, Relationship
from typing import Optional, List
from datetime import datetime
from app.models.business import Business


class InvoiceItem(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    invoice_id: int = Field(foreign_key="invoice.id")
    stock_item_id: int = Field(foreign_key="stockitem.id")
    quantity: int
    unit_price: float
    total: float
    
    invoice: Optional["Invoice"] = Relationship(back_populates="items")


class Invoice(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    business_id: int = Field(foreign_key="business.id")
    invoice_number: str = Field(unique=True, index=True)
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    subtotal: float
    tax: float = Field(default=0.0)
    total: float
    status: str = Field(default="draft")  # draft, paid, cancelled
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    business: Optional[Business] = Relationship()
    items: List[InvoiceItem] = Relationship(back_populates="invoice")


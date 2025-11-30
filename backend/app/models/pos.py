"""
POS (Point of Sale) models for fast checkout
"""
from sqlmodel import SQLModel, Field, Relationship, Column, JSON
from typing import Optional, List, TYPE_CHECKING
from datetime import datetime

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.business import Business
    from app.models.product import Product


class Sale(SQLModel, table=True):
    """Sales transaction record"""
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", index=True)
    business_id: int = Field(foreign_key="business.id", index=True)
    branch_id: Optional[int] = Field(default=None, foreign_key="branch.id")
    
    # Sale details
    total: float = Field(default=0.0)
    subtotal: float = Field(default=0.0)
    discount: float = Field(default=0.0)
    tax: float = Field(default=0.0)
    
    # Payment
    payment_method: str = Field(default="cash")  # cash, mobile_money, card, credit
    payment_status: str = Field(default="completed")  # completed, pending, failed
    
    # Customer (optional for walk-in sales)
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    
    # POS Session
    pos_session_id: Optional[int] = Field(default=None, foreign_key="possession.id")
    
    # Metadata
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    user: Optional["User"] = Relationship()
    business: Optional["Business"] = Relationship()
    items: List["SaleItem"] = Relationship(back_populates="sale")
    pos_session: Optional["POSSession"] = Relationship(back_populates="sales")


class SaleItem(SQLModel, table=True):
    """Individual items in a sale"""
    id: Optional[int] = Field(default=None, primary_key=True)
    sale_id: int = Field(foreign_key="sale.id", index=True)
    product_id: int = Field(foreign_key="product.id", index=True)
    
    # Item details
    product_name: str  # Snapshot of product name at time of sale
    quantity: int = Field(default=1, ge=1)
    unit_price: float = Field(default=0.0)
    subtotal: float = Field(default=0.0)
    
    # Metadata
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    sale: Optional[Sale] = Relationship(back_populates="items")
    product: Optional["Product"] = Relationship()


class POSSession(SQLModel, table=True):
    """POS session tracking (for daily reconciliation)"""
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", index=True)
    business_id: int = Field(foreign_key="business.id", index=True)
    branch_id: Optional[int] = Field(default=None, foreign_key="branch.id")
    
    # Session details
    opened_at: datetime = Field(default_factory=datetime.utcnow)
    closed_at: Optional[datetime] = None
    
    # Totals
    total_sales: float = Field(default=0.0)
    total_transactions: int = Field(default=0)
    
    # Payment breakdown
    cash_total: float = Field(default=0.0)
    mobile_money_total: float = Field(default=0.0)
    card_total: float = Field(default=0.0)
    credit_total: float = Field(default=0.0)
    
    # Status
    is_active: bool = Field(default=True)
    
    # Relationships
    user: Optional["User"] = Relationship()
    business: Optional["Business"] = Relationship()
    sales: List[Sale] = Relationship(back_populates="pos_session")


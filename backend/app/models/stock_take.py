"""
Stock Taking models for inventory counting and shrinkage management
"""
from sqlmodel import SQLModel, Field, Relationship, Column, JSON
from typing import Optional, List, TYPE_CHECKING
from datetime import datetime

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.business import Business
    from app.models.product import Product


class StockTakeSession(SQLModel, table=True):
    """Stock taking session"""
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", index=True)
    business_id: int = Field(foreign_key="business.id", index=True)
    branch_id: Optional[int] = Field(default=None, foreign_key="branch.id")
    
    # Session details
    started_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = None
    status: str = Field(default="open")  # open, review, approved, cancelled
    
    # Metadata
    notes: Optional[str] = None
    total_items_counted: int = Field(default=0)
    total_differences: int = Field(default=0)
    total_loss_value: float = Field(default=0.0)
    total_gain_value: float = Field(default=0.0)
    
    # Relationships
    user: Optional["User"] = Relationship()
    business: Optional["Business"] = Relationship()
    lines: List["StockTakeLine"] = Relationship(back_populates="session")


class StockTakeLine(SQLModel, table=True):
    """Individual product count in a stock take session"""
    id: Optional[int] = Field(default=None, primary_key=True)
    session_id: int = Field(foreign_key="stocktakesession.id", index=True)
    product_id: int = Field(foreign_key="product.id", index=True)
    
    # Counts
    expected_qty: int = Field(default=0)  # Stock level at start of session
    counted_qty: Optional[int] = None  # Actual count
    difference: int = Field(default=0)  # counted_qty - expected_qty
    difference_type: Optional[str] = None  # loss, over, match
    
    # Value calculations
    unit_cost: Optional[float] = None  # Snapshot of cost at time of count
    difference_value: float = Field(default=0.0)  # difference * unit_cost
    
    # Metadata
    counted_at: Optional[datetime] = None
    counted_by: Optional[int] = Field(default=None, foreign_key="user.id")
    notes: Optional[str] = None
    
    # Relationships
    session: Optional[StockTakeSession] = Relationship(back_populates="lines")
    product: Optional["Product"] = Relationship()


class StockAdjustment(SQLModel, table=True):
    """Record of stock adjustments (from stock takes or manual)"""
    id: Optional[int] = Field(default=None, primary_key=True)
    business_id: int = Field(foreign_key="business.id", index=True)
    branch_id: Optional[int] = Field(default=None, foreign_key="branch.id")
    product_id: int = Field(foreign_key="product.id", index=True)
    
    # Adjustment details
    previous_qty: int = Field(default=0)
    new_qty: int = Field(default=0)
    difference: int = Field(default=0)  # new_qty - previous_qty
    
    # Reason and reference
    reason: str = Field(default="manual")  # stock_take, manual, damage, spoilage, theft
    session_id: Optional[int] = Field(default=None, foreign_key="stocktakesession.id")
    reference_id: Optional[int] = None  # Can reference other entities
    reference_type: Optional[str] = None
    
    # Value
    unit_cost: Optional[float] = None
    adjustment_value: float = Field(default=0.0)  # difference * unit_cost
    
    # Metadata
    notes: Optional[str] = None
    adjusted_by: int = Field(foreign_key="user.id")
    adjusted_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    business: Optional["Business"] = Relationship()
    product: Optional["Product"] = Relationship()
    user: Optional["User"] = Relationship()


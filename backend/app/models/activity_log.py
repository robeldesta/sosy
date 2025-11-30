from sqlmodel import SQLModel, Field, Column, JSON, Relationship
from typing import Optional, Dict, Any, TYPE_CHECKING
from datetime import datetime
from app.models.business import Business

if TYPE_CHECKING:
    from app.models.user import User


class ActivityLog(SQLModel, table=True):
    __tablename__ = "activity_log"
    id: Optional[int] = Field(default=None, primary_key=True)
    business_id: int = Field(foreign_key="business.id", index=True)
    user_id: Optional[int] = Field(default=None, foreign_key="user.id", index=True)  # Who performed the action
    timestamp: datetime = Field(default_factory=datetime.utcnow, index=True)
    action_type: str = Field(index=True)  # invoice_created, purchase_created, stock_low, invoice_paid, product_updated, quick_sell
    entity_type: Optional[str] = None  # invoice, item, stock, expense, payment, etc.
    entity_id: Optional[int] = None  # ID of the affected entity
    description: str
    meta_data: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSON))
    
    business: Optional[Business] = Relationship()
    user: Optional["User"] = Relationship()


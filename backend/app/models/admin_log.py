"""
Admin action logs for audit trail
"""
from sqlmodel import SQLModel, Field, Relationship
from typing import Optional, TYPE_CHECKING
from datetime import datetime

if TYPE_CHECKING:
    from app.models.user import User


class AdminLog(SQLModel, table=True):
    """Immutable audit trail of admin actions"""
    id: Optional[int] = Field(default=None, primary_key=True)
    admin_id: int = Field(foreign_key="user.id", index=True)
    
    # Action details
    action: str = Field(index=True)  # suspend_business, upgrade_plan, reset_store, etc.
    entity_type: Optional[str] = None  # business, user, subscription, etc.
    entity_id: Optional[int] = None
    
    # Change tracking
    before_json: Optional[str] = None  # JSON snapshot before change
    after_json: Optional[str] = None  # JSON snapshot after change
    
    # Request metadata
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow, index=True)
    
    # Relationships
    admin: Optional["User"] = Relationship()


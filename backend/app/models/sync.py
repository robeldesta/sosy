"""
Sync models for offline-first multi-device synchronization
"""
from sqlmodel import SQLModel, Field, Relationship, Column, JSON
from typing import Optional, Dict, Any, TYPE_CHECKING
from datetime import datetime

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.business import Business


class SyncState(SQLModel, table=True):
    """Track last sync timestamp per user/device"""
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", index=True)
    device_id: Optional[str] = None  # Optional device identifier
    last_sync_at: Optional[datetime] = None
    last_pull_at: Optional[datetime] = None
    sync_version: int = Field(default=1)  # Increment on schema changes
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    user: Optional["User"] = Relationship()


class SyncAction(SQLModel, table=True):
    """Server-side log of sync actions (for debugging and recovery)"""
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", index=True)
    action_id: str = Field(index=True)  # Client-generated UUID
    action_type: str  # sale, stock_update, product_update, invoice
    payload: Dict[str, Any] = Field(default={}, sa_column=Column(JSON))
    status: str = Field(default="pending")  # pending, processed, failed
    error_message: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    processed_at: Optional[datetime] = None
    
    user: Optional["User"] = Relationship()


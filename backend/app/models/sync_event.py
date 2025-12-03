"""
Real-time sync events for event-driven architecture
"""
from sqlmodel import SQLModel, Field, Column, JSON
from typing import Optional, Dict, Any
from datetime import datetime


class SyncEvent(SQLModel, table=True):
    """Real-time sync events emitted by business actions"""
    id: Optional[int] = Field(default=None, primary_key=True)
    business_id: int = Field(index=True)
    branch_id: Optional[int] = Field(default=None, index=True)
    
    # Event details
    event_type: str = Field(index=True)  # SALE_CREATED, STOCK_UPDATED, etc.
    payload: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSON))
    
    # Source
    user_id: Optional[int] = Field(default=None, foreign_key="user.id")
    device_id: Optional[str] = None
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow, index=True)
    processed_at: Optional[datetime] = None


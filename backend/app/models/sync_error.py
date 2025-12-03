"""
Sync errors for monitoring and debugging
"""
from sqlmodel import SQLModel, Field, Column, JSON
from typing import Optional, Dict, Any
from datetime import datetime


class SyncError(SQLModel, table=True):
    """Sync errors for monitoring"""
    id: Optional[int] = Field(default=None, primary_key=True)
    business_id: int = Field(index=True)
    user_id: Optional[int] = Field(default=None, foreign_key="user.id")
    
    # Error details
    error_type: str = Field(index=True)  # conflict, validation, network, etc.
    error_msg: str
    payload: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSON))
    
    # Context
    sync_action_id: Optional[str] = None  # Reference to sync action
    device_id: Optional[str] = None
    
    # Resolution
    resolved: bool = Field(default=False, index=True)
    resolved_at: Optional[datetime] = None
    resolved_by: Optional[int] = Field(default=None, foreign_key="user.id")
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow, index=True)


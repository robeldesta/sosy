"""
System health metrics for monitoring
"""
from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime


class SystemHealth(SQLModel, table=True):
    """System health metrics"""
    id: Optional[int] = Field(default=None, primary_key=True)
    
    # Metric details
    metric_name: str = Field(index=True)  # websocket_delay, sync_errors_count, db_connections, etc.
    metric_value: float
    metric_unit: Optional[str] = None  # ms, count, percent, etc.
    
    # Context
    component: Optional[str] = None  # websocket, database, redis, etc.
    severity: Optional[str] = None  # info, warning, error, critical
    
    # Timestamps
    timestamp: datetime = Field(default_factory=datetime.utcnow, index=True)


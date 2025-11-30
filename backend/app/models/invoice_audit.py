"""
Invoice audit trail model
"""
from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime


class InvoiceAuditLog(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    invoice_id: int = Field(foreign_key="invoice.id", index=True)
    action: str  # created, updated, status_changed, paid, cancelled
    old_status: Optional[str] = None
    new_status: Optional[str] = None
    changed_by: Optional[int] = Field(default=None, foreign_key="user.id")
    notes: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow, index=True)


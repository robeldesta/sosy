"""
Sync schemas for request/response validation
"""
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from datetime import datetime


class SyncActionRequest(BaseModel):
    id: str  # Client-generated UUID
    type: str  # sale, stock_update, product_update, invoice
    payload: Dict[str, Any]
    created_at: datetime


class SyncPushRequest(BaseModel):
    device_id: Optional[str] = None
    actions: List[SyncActionRequest]


class SyncPushResponse(BaseModel):
    success: bool
    processed_ids: List[str]
    failed_ids: List[str]
    errors: Dict[str, str] = {}


class SyncChange(BaseModel):
    type: str  # product, stock, sale, invoice
    entity_id: int
    data: Dict[str, Any]
    updated_at: datetime
    action: str  # created, updated, deleted


class SyncPullResponse(BaseModel):
    server_time: datetime
    changes: List[SyncChange]
    has_more: bool = False


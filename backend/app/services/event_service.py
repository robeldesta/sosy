"""
Event service for real-time sync events
"""
from sqlmodel import Session
from typing import Dict, Any, Optional
from datetime import datetime
from app.models.sync_event import SyncEvent


def emit_sync_event(
    session: Session,
    business_id: int,
    event_type: str,
    payload: Dict[str, Any],
    branch_id: Optional[int] = None,
    user_id: Optional[int] = None,
    device_id: Optional[str] = None
) -> SyncEvent:
    """
    Emit a sync event for real-time propagation
    
    Events are stored in DB and should be broadcast via WebSocket/Redis
    """
    event = SyncEvent(
        business_id=business_id,
        branch_id=branch_id,
        event_type=event_type,
        payload=payload,
        user_id=user_id,
        device_id=device_id
    )
    
    session.add(event)
    session.commit()
    session.refresh(event)
    
    # Broadcast via WebSocket (non-blocking)
    try:
        from app.api.websocket import broadcast_sync_event
        import asyncio
        
        # Run async broadcast in background
        loop = asyncio.get_event_loop()
        if loop.is_running():
            asyncio.create_task(broadcast_sync_event(business_id, event_type, payload))
        else:
            loop.run_until_complete(broadcast_sync_event(business_id, event_type, payload))
    except Exception as e:
        # Don't fail if WebSocket broadcast fails
        print(f"Failed to broadcast sync event: {e}")
    
    return event


# Event type constants
EVENT_SALE_CREATED = "SALE_CREATED"
EVENT_STOCK_UPDATED = "STOCK_UPDATED"
EVENT_PURCHASE_RECEIVED = "PURCHASE_RECEIVED"
EVENT_EXPENSE_ADDED = "EXPENSE_ADDED"
EVENT_CUSTOMER_UPDATED = "CUSTOMER_UPDATED"
EVENT_SETTINGS_CHANGED = "SETTINGS_CHANGED"
EVENT_INVOICE_CREATED = "INVOICE_CREATED"
EVENT_PAYMENT_RECEIVED = "PAYMENT_RECEIVED"
EVENT_PRODUCT_UPDATED = "PRODUCT_UPDATED"
EVENT_PRODUCT_CREATED = "PRODUCT_CREATED"
EVENT_PRODUCT_DELETED = "PRODUCT_DELETED"


"""
Sync API endpoints for offline-first multi-device synchronization
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session
from typing import Optional
from datetime import datetime
from app.api.dependencies import get_db, get_current_user
from app.models.user import User
from app.models.business import Business
from app.services.business import get_business_by_user_id
from app.services.sync_service import (
    get_or_create_sync_state,
    update_sync_state,
    process_sync_actions,
    get_sync_changes
)
from app.schemas.sync import (
    SyncPushRequest,
    SyncPushResponse,
    SyncPullResponse,
    SyncChange
)
from app.api.middleware.subscription import require_active_subscription

router = APIRouter(prefix="/sync", tags=["sync"])


@router.post("/push", response_model=SyncPushResponse)
async def sync_push(
    push_data: SyncPushRequest,
    current_user: User = Depends(require_active_subscription),
    db: Session = Depends(get_db)
):
    """
    Push sync actions from client to server
    
    Processes actions in order and returns processed/failed IDs
    """
    business = get_business_by_user_id(db, current_user.id)
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")
    
    # Convert actions to dict format
    actions = [
        {
            "id": action.id,
            "type": action.type,
            "payload": action.payload,
            "created_at": action.created_at
        }
        for action in push_data.actions
    ]
    
    # Process actions
    processed_ids, failed_ids, errors = process_sync_actions(
        session=db,
        user_id=current_user.id,
        business_id=business.id,
        actions=actions
    )
    
    # Update sync state
    update_sync_state(db, current_user.id, push_data.device_id)
    
    return SyncPushResponse(
        success=len(failed_ids) == 0,
        processed_ids=processed_ids,
        failed_ids=failed_ids,
        errors=errors
    )


@router.get("/pull", response_model=SyncPullResponse)
async def sync_pull(
    since: Optional[str] = Query(None, description="ISO timestamp of last sync"),
    current_user: User = Depends(require_active_subscription),
    db: Session = Depends(get_db)
):
    """
    Pull changes from server since last sync
    
    Returns delta of changes (products, stock, sales, invoices)
    """
    business = get_business_by_user_id(db, current_user.id)
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")
    
    # Parse since timestamp
    since_dt = None
    if since:
        try:
            since_dt = datetime.fromisoformat(since.replace('Z', '+00:00'))
        except:
            raise HTTPException(status_code=400, detail="Invalid since timestamp format")
    
    # Get changes
    changes_data = get_sync_changes(
        session=db,
        user_id=current_user.id,
        business_id=business.id,
        since=since_dt
    )
    
    # Convert to SyncChange objects
    changes = [
        SyncChange(
            type=change["type"],
            entity_id=change["entity_id"],
            data=change["data"],
            updated_at=change["updated_at"],
            action=change["action"]
        )
        for change in changes_data
    ]
    
    # Update sync state
    sync_state = get_or_create_sync_state(db, current_user.id)
    sync_state.last_pull_at = datetime.utcnow()
    sync_state.updated_at = datetime.utcnow()
    db.add(sync_state)
    db.commit()
    
    return SyncPullResponse(
        server_time=datetime.utcnow(),
        changes=changes,
        has_more=False  # Could implement pagination if needed
    )


@router.get("/state")
async def get_sync_state(
    current_user: User = Depends(require_active_subscription),
    db: Session = Depends(get_db)
):
    """Get current sync state for user"""
    sync_state = get_or_create_sync_state(db, current_user.id)
    
    return {
        "last_sync_at": sync_state.last_sync_at.isoformat() if sync_state.last_sync_at else None,
        "last_pull_at": sync_state.last_pull_at.isoformat() if sync_state.last_pull_at else None,
        "sync_version": sync_state.sync_version
    }


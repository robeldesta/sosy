from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from typing import List
from app.api.dependencies import get_db, get_current_user
from app.models.user import User
from app.models.activity_log import ActivityLog
from app.services.business import get_business_by_user_id
from app.services.permissions import can_access_reports
from pydantic import BaseModel

router = APIRouter(prefix="/activity", tags=["activity"])


class ActivityLogResponse(BaseModel):
    id: int
    timestamp: str
    action_type: str
    entity_type: str | None
    entity_id: int | None
    description: str
    user_id: int | None
    user_name: str | None
    meta_data: dict | None


@router.get("", response_model=List[ActivityLogResponse])
async def get_activity(
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get recent activity logs (owner/manager only)"""
    # Only owners and managers can view activity logs
    if not can_access_reports(current_user):
        raise HTTPException(
            status_code=403,
            detail="You don't have permission to view activity logs"
        )
    
    business = get_business_by_user_id(db, current_user.id)
    if not business:
        return []
    
    # Get activities with user information
    statement = select(ActivityLog, User).outerjoin(
        User, ActivityLog.user_id == User.id
    ).where(
        ActivityLog.business_id == business.id
    ).order_by(ActivityLog.timestamp.desc()).limit(limit)
    
    results = db.exec(statement).all()
    
    activities = []
    for result in results:
        if isinstance(result, tuple):
            act, user = result
        else:
            act = result
            user = None
        
        user_name = None
        if user:
            user_name = f"{user.first_name or ''} {user.last_name or ''}".strip() or user.username
        
        activities.append(ActivityLogResponse(
            id=act.id,
            timestamp=act.timestamp.isoformat(),
            action_type=act.action_type,
            entity_type=act.entity_type,
            entity_id=act.entity_id,
            description=act.description,
            user_id=act.user_id,
            user_name=user_name,
            meta_data=act.meta_data or {}
        ))
    
    return activities


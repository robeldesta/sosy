"""
Invite API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlmodel import Session
from typing import List, Optional
from app.api.dependencies import get_db, get_current_user
from app.models.user import User
from app.services.business import get_business_by_user_id
from app.services.invite_service import (
    create_invite,
    get_business_invites,
    validate_invite,
    use_invite,
)
from app.services.permissions import can_manage_staff
from app.services.activity_service import log_user_joined
from pydantic import BaseModel

router = APIRouter(prefix="/invite", tags=["invite"])


class InviteCreate(BaseModel):
    role: str = "staff"  # owner, manager, staff
    branch_id: Optional[int] = None
    expires_in_hours: int = 24


class InviteResponse(BaseModel):
    id: int
    code: str
    role: str
    branch_id: Optional[int] = None
    expires_at: str
    is_active: bool
    used_by: Optional[int] = None
    used_at: Optional[str] = None
    created_at: str


@router.post("", response_model=InviteResponse, status_code=status.HTTP_201_CREATED)
async def create_invite_endpoint(
    invite_data: InviteCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new invite (owner/manager only)"""
    if not can_manage_staff(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to create invites"
        )
    
    business = get_business_by_user_id(db, current_user.id)
    if not business:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Business not found"
        )
    
    invite = create_invite(
        session=db,
        business_id=business.id,
        role=invite_data.role,
        branch_id=invite_data.branch_id,
        created_by=current_user.id,
        expires_in_hours=invite_data.expires_in_hours
    )
    
    return invite


@router.get("", response_model=List[InviteResponse])
async def list_invites_endpoint(
    active_only: bool = Query(True),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all invites for business (owner/manager only)"""
    if not can_manage_staff(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to view invites"
        )
    
    business = get_business_by_user_id(db, current_user.id)
    if not business:
        return []
    
    invites = get_business_invites(db, business.id, active_only=active_only)
    return invites


@router.get("/validate/{code}")
async def validate_invite_endpoint(
    code: str,
    db: Session = Depends(get_db)
):
    """Validate an invite code (public endpoint)"""
    invite = validate_invite(db, code)
    if not invite:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invalid or expired invite code"
        )
    
    return {
        "valid": True,
        "role": invite.role,
        "expires_at": invite.expires_at.isoformat()
    }


@router.post("/use/{code}")
async def use_invite_endpoint(
    code: str,
    telegram_id: int = Query(...),
    first_name: Optional[str] = None,
    last_name: Optional[str] = None,
    username: Optional[str] = None,
    photo_url: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Use an invite code to join a business"""
    user_data = {
        "first_name": first_name,
        "last_name": last_name,
        "username": username,
        "photo_url": photo_url,
    }
    
    user = use_invite(db, code, telegram_id, user_data)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to use invite code"
        )
    
    # Log user joined activity
    log_user_joined(
        session=db,
        business_id=user.business_id,
        user_id=user.id,
        user_name=f"{user.first_name or ''} {user.last_name or ''}".strip() or user.username or f"User {user.id}",
        role=user.role
    )
    
    return {
        "success": True,
        "user_id": user.id,
        "role": user.role,
        "business_id": user.business_id
    }


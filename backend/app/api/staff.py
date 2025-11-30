"""
Staff management API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlmodel import Session, select
from typing import List, Optional
from datetime import datetime, timedelta
from app.api.dependencies import get_db, get_current_user
from app.models.user import User
from app.services.business import get_business_by_user_id
from app.services.permissions import can_manage_staff
from app.services.staff_insights import get_staff_insights
from pydantic import BaseModel

router = APIRouter(prefix="/staff", tags=["staff"])


class StaffMember(BaseModel):
    id: int
    telegram_id: int
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    username: Optional[str] = None
    role: str
    branch_id: Optional[int] = None
    last_login_at: Optional[str] = None
    created_at: str


@router.get("", response_model=List[StaffMember])
async def list_staff_endpoint(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all staff members (owner/manager only)"""
    if not can_manage_staff(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to view staff"
        )
    
    business = get_business_by_user_id(db, current_user.id)
    if not business:
        return []
    
    statement = select(User).where(
        User.business_id == business.id
    ).order_by(User.created_at.desc())
    
    staff = db.exec(statement).all()
    return [
        {
            "id": user.id,
            "telegram_id": user.telegram_id,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "username": user.username,
            "role": user.role,
            "branch_id": user.branch_id,
            "last_login_at": user.last_login_at.isoformat() if user.last_login_at else None,
            "created_at": user.created_at.isoformat(),
        }
        for user in staff
    ]


@router.delete("/{user_id}")
async def remove_staff_endpoint(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Remove a staff member (owner only)"""
    if current_user.role != "owner":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only owners can remove staff"
        )
    
    business = get_business_by_user_id(db, current_user.id)
    if not business:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Business not found"
        )
    
    staff_user = db.get(User, user_id)
    if not staff_user or staff_user.business_id != business.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Staff member not found"
        )
    
    if staff_user.role == "owner":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot remove owner"
        )
    
    # Remove business association
    staff_user.business_id = None
    staff_user.branch_id = None
    db.add(staff_user)
    db.commit()
    
    return {"success": True}


@router.get("/insights")
async def get_staff_insights_endpoint(
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get staff performance insights (owner only)"""
    if current_user.role != "owner":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only owners can view staff insights"
        )
    
    business = get_business_by_user_id(db, current_user.id)
    if not business:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Business not found"
        )
    
    insights = get_staff_insights(db, business.id, start_date, end_date)
    return insights


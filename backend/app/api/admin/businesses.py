"""
Admin API endpoints for business management
"""
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from typing import Optional
from sqlmodel import Session, select
from typing import List, Optional
from app.api.dependencies import get_db, get_current_user
from app.models.user import User
from app.models.business import Business
from app.services.business import get_business_by_user_id
from app.services.admin_service import (
    suspend_business,
    upgrade_business_plan,
    get_business_metrics,
    log_admin_action
)

router = APIRouter(prefix="/admin/businesses", tags=["admin"])


def require_admin(current_user: User = Depends(get_current_user)) -> User:
    """Require admin role"""
    # TODO: Implement admin role check
    # For now, allow if user is owner of a business
    if not current_user.role or current_user.role != "owner":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user


@router.get("")
async def list_businesses(
    search: Optional[str] = Query(None),
    limit: int = Query(50, le=100),
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """List all businesses"""
    statement = select(Business)
    
    if search:
        search_term = f"%{search}%"
        statement = statement.where(Business.name.ilike(search_term))
    
    statement = statement.limit(limit).order_by(Business.created_at.desc())
    businesses = list(db.exec(statement).all())
    
    return businesses


@router.get("/{business_id}")
async def get_business(
    business_id: int,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Get business details"""
    business = db.get(Business, business_id)
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")
    
    return business


@router.post("/{business_id}/suspend")
async def suspend_business_endpoint(
    business_id: int,
    reason: Optional[str] = None,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
    request: Request = None
):
    """Suspend a business"""
    try:
        business = suspend_business(
            db,
            current_user.id,
            business_id,
            reason,
            request.client.host if request else None
        )
        return {"success": True, "business": business}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{business_id}/upgrade")
async def upgrade_plan_endpoint(
    business_id: int,
    plan: str,
    months: int,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
    request: Request = None
):
    """Upgrade business plan"""
    try:
        business = upgrade_business_plan(
            db,
            current_user.id,
            business_id,
            plan,
            months,
            request.client.host if request else None
        )
        return {"success": True, "business": business}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{business_id}/metrics")
async def get_business_metrics_endpoint(
    business_id: int,
    days: int = Query(30, ge=1, le=365),
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Get business metrics"""
    metrics = get_business_metrics(db, business_id, days)
    return metrics


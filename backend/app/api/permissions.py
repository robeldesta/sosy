"""
Permission and role-based access control API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session
from app.api.dependencies import get_db, get_current_user
from app.models.user import User
from app.services.permissions import (
    has_permission,
    can_view_cost_prices,
    can_view_profit,
    can_access_reports,
    can_access_settings,
    can_export_data,
    can_manage_staff,
    can_reconcile_cash,
    can_adjust_stock,
    filter_sensitive_data,
)
from app.services.business import get_business_by_user_id
from pydantic import BaseModel

router = APIRouter(prefix="/permissions", tags=["permissions"])


class PermissionCheck(BaseModel):
    permission: str
    has_permission: bool


@router.get("/check/{permission}")
async def check_permission(
    permission: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Check if current user has a specific permission"""
    return {
        "permission": permission,
        "has_permission": has_permission(current_user, permission)
    }


@router.get("/capabilities")
async def get_user_capabilities(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all capabilities for current user"""
    business = get_business_by_user_id(db, current_user.id)
    allow_staff_adjustments = business.allow_staff_stock_adjustments if business else False
    show_sensitive = business.show_sensitive_data if business else False
    
    return {
        "role": current_user.role,
        "can_view_cost_prices": can_view_cost_prices(current_user),
        "can_view_profit": can_view_profit(current_user),
        "can_access_reports": can_access_reports(current_user),
        "can_access_settings": can_access_settings(current_user),
        "can_export_data": can_export_data(current_user),
        "can_manage_staff": can_manage_staff(current_user),
        "can_reconcile_cash": can_reconcile_cash(current_user),
        "can_adjust_stock": can_adjust_stock(current_user, allow_staff_adjustments),
        "show_sensitive_data": show_sensitive and current_user.role == "owner",
    }


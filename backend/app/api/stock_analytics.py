"""
Stock analytics API endpoints
"""
from fastapi import APIRouter, Depends, Query
from sqlmodel import Session
from typing import List
from app.api.dependencies import get_db, get_current_user
from app.models.user import User
from app.services.business import get_business_by_user_id
from app.services.stock_analytics import (
    get_top_selling_items,
    get_slow_movers,
    get_dead_stock,
    get_stock_out_risk,
)

router = APIRouter(prefix="/analytics/stock", tags=["stock-analytics"])


@router.get("/top-sellers")
async def get_top_sellers(
    days: int = Query(30, ge=1, le=365),
    limit: int = Query(10, ge=1, le=50),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get top selling items"""
    business = get_business_by_user_id(db, current_user.id)
    if not business:
        return []
    
    return get_top_selling_items(db, business.id, days, limit)


@router.get("/slow-movers")
async def get_slow_movers_endpoint(
    days: int = Query(30, ge=1, le=365),
    min_sales: int = Query(3, ge=0),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get slow moving items"""
    business = get_business_by_user_id(db, current_user.id)
    if not business:
        return []
    
    return get_slow_movers(db, business.id, days, min_sales)


@router.get("/dead-stock")
async def get_dead_stock_endpoint(
    days: int = Query(60, ge=1, le=365),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get dead stock (no movement in N days)"""
    business = get_business_by_user_id(db, current_user.id)
    if not business:
        return []
    
    return get_dead_stock(db, business.id, days)


@router.get("/stock-out-risk")
async def get_stock_out_risk_endpoint(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get items at risk of stock-out"""
    business = get_business_by_user_id(db, current_user.id)
    if not business:
        return []
    
    return get_stock_out_risk(db, business.id)


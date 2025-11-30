from fastapi import APIRouter, Depends
from sqlmodel import Session
from app.api.dependencies import get_db, get_current_user
from app.models.user import User
from app.services.business import get_business_by_user_id
from app.services.dashboard_service import get_dashboard_data, get_daily_summary
from datetime import datetime, timedelta
from typing import Dict, Any

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("")
async def get_analytics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Get analytics data"""
    business = get_business_by_user_id(db, current_user.id)
    if not business:
        return {
            "today_sales": 0.0,
            "week_sales": 0.0,
            "month_sales": 0.0,
            "low_stock_count": 0,
            "top_items": []
        }
    
    # Get today's summary
    today_summary = get_daily_summary(db, business.id, datetime.utcnow())
    
    # Get week's sales (last 7 days)
    week_start = datetime.utcnow() - timedelta(days=7)
    week_summary = get_daily_summary(db, business.id, week_start)
    
    # Get month's sales (last 30 days)
    month_start = datetime.utcnow() - timedelta(days=30)
    month_summary = get_daily_summary(db, business.id, month_start)
    
    # Get dashboard data for low stock and top products
    dashboard_data = get_dashboard_data(db, business.id)
    
    return {
        "today_sales": today_summary["sales"],
        "week_sales": week_summary["sales"],
        "month_sales": month_summary["sales"],
        "low_stock_count": len(dashboard_data["low_stock"]),
        "top_items": dashboard_data["top_products_7_days"][:5]
    }


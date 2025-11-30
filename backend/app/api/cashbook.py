"""
Cashbook API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session
from typing import Optional
from datetime import datetime, timedelta
from app.api.dependencies import get_db, get_current_user
from app.models.user import User
from app.services.business import get_business_by_user_id
from app.services.cashbook_service import (
    get_cashbook_summary,
    reconcile_cash,
)
from app.schemas.cashbook import (
    CashbookSummary,
    CashReconciliationCreate,
    CashReconciliationResponse,
)

router = APIRouter(prefix="/cashbook", tags=["cashbook"])


@router.get("/summary", response_model=CashbookSummary)
async def get_cashbook_summary_endpoint(
    date: Optional[str] = Query(None, description="Date in YYYY-MM-DD format (defaults to today)"),
    period: Optional[str] = Query("day", regex="^(day|week|month)$"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get cashbook summary for a date or period"""
    business = get_business_by_user_id(db, current_user.id)
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")
    
    # Parse date or use today
    if date:
        try:
            target_date = datetime.strptime(date, "%Y-%m-%d")
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD.")
    else:
        target_date = datetime.utcnow()
    
    # Calculate date range based on period
    if period == "day":
        start_date = target_date.replace(hour=0, minute=0, second=0, microsecond=0)
        end_date = target_date.replace(hour=23, minute=59, second=59, microsecond=999999)
    elif period == "week":
        start_date = (target_date - timedelta(days=target_date.weekday())).replace(hour=0, minute=0, second=0, microsecond=0)
        end_date = (start_date + timedelta(days=6)).replace(hour=23, minute=59, second=59, microsecond=999999)
    else:  # month
        start_date = target_date.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        if target_date.month == 12:
            end_date = target_date.replace(year=target_date.year + 1, month=1, day=1) - timedelta(days=1)
        else:
            end_date = target_date.replace(month=target_date.month + 1, day=1) - timedelta(days=1)
        end_date = end_date.replace(hour=23, minute=59, second=59, microsecond=999999)
    
    summary = get_cashbook_summary(db, business.id, start_date, end_date)
    
    return CashbookSummary(
        date=target_date.strftime("%Y-%m-%d"),
        cash_in=summary["cash_in"],
        cash_out=summary["cash_out"],
        net_cash=summary["net_cash"],
        cash_by_method=summary["cash_by_method"],
        entries=[CashbookEntryResponse.model_validate(e) for e in summary["entries"]],
    )


@router.post("/reconcile", response_model=CashReconciliationResponse)
async def reconcile_cash_endpoint(
    reconciliation_data: CashReconciliationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Reconcile cash - compare expected vs actual"""
    business = get_business_by_user_id(db, current_user.id)
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")
    
    try:
        reconciliation = reconcile_cash(db, business.id, reconciliation_data, current_user.id)
        return reconciliation
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reconciling cash: {str(e)}")


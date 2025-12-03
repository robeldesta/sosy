"""
Reports API endpoints
"""
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlmodel import Session, select, func
from typing import Optional
from datetime import datetime, timedelta
from app.api.dependencies import get_db, get_current_user
from app.models.user import User
from app.services.permissions import can_access_reports
from app.models.invoice import Invoice, InvoiceItem
from app.models.expense import Expense
from app.models.payment import Payment
from app.models.product import Product
from app.models.stock import LegacyStockItem
from app.services.business import get_business_by_user_id
from app.services.aging_service import get_aging_report

router = APIRouter(prefix="/reports", tags=["reports"])


@router.get("/daily-sales")
async def get_daily_sales_report(
    date: Optional[str] = Query(None, description="Date in YYYY-MM-DD format"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get daily sales report"""
    business = get_business_by_user_id(db, current_user.id)
    if not business:
        return {"sales": 0, "invoices": [], "total_invoices": 0}
    
    if date:
        try:
            target_date = datetime.strptime(date, "%Y-%m-%d")
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date format")
    else:
        target_date = datetime.utcnow()
    
    start_date = target_date.replace(hour=0, minute=0, second=0, microsecond=0)
    end_date = target_date.replace(hour=23, minute=59, second=59, microsecond=999999)
    
    invoices_statement = select(Invoice).where(
        Invoice.business_id == business.id,
        Invoice.created_at >= start_date,
        Invoice.created_at <= end_date,
        Invoice.status != "cancelled"
    )
    invoices = db.exec(invoices_statement).all()
    
    total_sales = sum(inv.total for inv in invoices)
    
    return {
        "date": target_date.strftime("%Y-%m-%d"),
        "total_sales": total_sales,
        "total_invoices": len(invoices),
        "invoices": [{"id": inv.id, "number": inv.invoice_number, "total": inv.total} for inv in invoices],
    }


@router.get("/weekly-summary")
async def get_weekly_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get weekly summary report"""
    business = get_business_by_user_id(db, current_user.id)
    if not business:
        return {"sales": 0, "expenses": 0, "net": 0}
    
    today = datetime.utcnow()
    week_start = (today - timedelta(days=today.weekday())).replace(hour=0, minute=0, second=0, microsecond=0)
    week_end = today.replace(hour=23, minute=59, second=59, microsecond=999999)
    
    # Sales
    sales_statement = select(func.sum(Invoice.total)).where(
        Invoice.business_id == business.id,
        Invoice.created_at >= week_start,
        Invoice.created_at <= week_end,
        Invoice.status != "cancelled"
    )
    total_sales = db.exec(sales_statement).first() or 0.0
    
    # Expenses
    expenses_statement = select(func.sum(Expense.amount)).where(
        Expense.business_id == business.id,
        Expense.expense_date >= week_start,
        Expense.expense_date <= week_end
    )
    total_expenses = db.exec(expenses_statement).first() or 0.0
    
    return {
        "period": f"{week_start.strftime('%Y-%m-%d')} to {week_end.strftime('%Y-%m-%d')}",
        "total_sales": total_sales,
        "total_expenses": total_expenses,
        "net": total_sales - total_expenses,
    }


@router.get("/monthly-overview")
async def get_monthly_overview(
    month: Optional[int] = Query(None, ge=1, le=12),
    year: Optional[int] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get monthly overview report"""
    business = get_business_by_user_id(db, current_user.id)
    if not business:
        return {"sales": 0, "expenses": 0, "profit": 0}
    
    today = datetime.utcnow()
    target_month = month or today.month
    target_year = year or today.year
    
    month_start = datetime(target_year, target_month, 1)
    if target_month == 12:
        month_end = datetime(target_year + 1, 1, 1) - timedelta(days=1)
    else:
        month_end = datetime(target_year, target_month + 1, 1) - timedelta(days=1)
    month_end = month_end.replace(hour=23, minute=59, second=59, microsecond=999999)
    
    # Sales
    sales_statement = select(func.sum(Invoice.total)).where(
        Invoice.business_id == business.id,
        Invoice.created_at >= month_start,
        Invoice.created_at <= month_end,
        Invoice.status != "cancelled"
    )
    total_sales = db.exec(sales_statement).first() or 0.0
    
    # Expenses
    expenses_statement = select(func.sum(Expense.amount)).where(
        Expense.business_id == business.id,
        Expense.expense_date >= month_start,
        Expense.expense_date <= month_end
    )
    total_expenses = db.exec(expenses_statement).first() or 0.0
    
    # Profit estimation (simplified - would need cost prices from products)
    profit_estimate = total_sales - total_expenses  # Simplified
    
    return {
        "month": target_month,
        "year": target_year,
        "total_sales": total_sales,
        "total_expenses": total_expenses,
        "profit_estimate": profit_estimate,
    }


@router.get("/expenses-by-category")
async def get_expenses_by_category(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get expenses grouped by category"""
    business = get_business_by_user_id(db, current_user.id)
    if not business:
        return []
    
    # Parse dates
    if start_date:
        try:
            start = datetime.strptime(start_date, "%Y-%m-%d")
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid start_date format")
    else:
        start = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    
    if end_date:
        try:
            end = datetime.strptime(end_date, "%Y-%m-%d").replace(hour=23, minute=59, second=59, microsecond=999999)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid end_date format")
    else:
        end = datetime.utcnow()
    
    # Get expenses grouped by category
    from app.models.expense import ExpenseCategory
    expenses_statement = select(
        Expense.category_id,
        ExpenseCategory.name,
        func.sum(Expense.amount).label("total")
    ).join(
        ExpenseCategory, Expense.category_id == ExpenseCategory.id, isouter=True
    ).where(
        Expense.business_id == business.id,
        Expense.expense_date >= start,
        Expense.expense_date <= end
    ).group_by(Expense.category_id, ExpenseCategory.name)
    
    results = db.exec(expenses_statement).all()
    
    return [
        {
            "category_id": r[0],
            "category_name": r[1] or "Uncategorized",
            "total": float(r[2]) if r[2] else 0.0,
        }
        for r in results
    ]


@router.get("/credit-aging")
async def get_credit_aging(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get credit aging report"""
    business = get_business_by_user_id(db, current_user.id)
    if not business:
        return {"total_outstanding": 0, "aging_buckets": {}}
    
    report = get_aging_report(db, business.id, current_user.branch_id)
    return {
        "total_outstanding": report.total_outstanding,
        "aging_buckets": [
            {
                "bucket": bucket.bucket,
                "count": bucket.count,
                "total_amount": bucket.total_amount,
                "customers": bucket.customers
            }
            for bucket in report.buckets
        ],
    }


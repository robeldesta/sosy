"""
Credit sales API endpoints
"""
from fastapi import APIRouter, Depends, Query
from sqlmodel import Session
from typing import Optional
from app.api.dependencies import get_db, get_current_user
from app.models.user import User
from app.services.business import get_business_by_user_id
from app.services.credit_service import (
    get_customer_credit_summary,
    get_all_customers_with_credit,
)

router = APIRouter(prefix="/credit", tags=["credit"])


@router.get("/customer")
async def get_customer_credit(
    customer_phone: Optional[str] = Query(None, description="Customer phone number"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get credit summary for a customer or all customers"""
    business = get_business_by_user_id(db, current_user.id)
    if not business:
        return {
            "total_outstanding": 0.0,
            "invoice_count": 0,
            "invoices": [],
            "aging_buckets": {"0-30": [], "31-60": [], "60+": []},
        }
    
    summary = get_customer_credit_summary(db, business.id, customer_phone)
    return summary


@router.get("/customers")
async def get_all_customers_credit(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all customers with outstanding credit"""
    business = get_business_by_user_id(db, current_user.id)
    if not business:
        return []
    
    customers = get_all_customers_with_credit(db, business.id)
    return customers


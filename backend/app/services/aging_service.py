"""
Aging service for credit aging reports
"""
from sqlmodel import Session, select
from typing import List, Optional
from datetime import datetime, timedelta
from app.models.customer import Customer
from app.schemas.customer import AgingBucket, AgingReportResponse


def get_aging_report(session: Session, business_id: int, branch_id: Optional[int] = None) -> AgingReportResponse:
    """
    Generate credit aging report
    
    Buckets:
    - 0-7 days
    - 8-30 days
    - 31-60 days
    - 60+ days
    """
    now = datetime.utcnow()
    
    # Get all customers with outstanding balance
    statement = select(Customer).where(
        Customer.business_id == business_id,
        Customer.balance > 0,
        Customer.is_active == True
    )
    
    if branch_id:
        statement = statement.where(Customer.branch_id == branch_id)
    
    customers = list(session.exec(statement).all())
    
    # Initialize buckets
    buckets = {
        "0-7": {"count": 0, "total_amount": 0.0, "customers": []},
        "8-30": {"count": 0, "total_amount": 0.0, "customers": []},
        "31-60": {"count": 0, "total_amount": 0.0, "customers": []},
        "60+": {"count": 0, "total_amount": 0.0, "customers": []},
    }
    
    total_outstanding = 0.0
    
    for customer in customers:
        total_outstanding += customer.balance
        
        # Determine age based on last_sale_at or last_payment_at
        # Use last_sale_at if available, otherwise use created_at
        reference_date = customer.last_sale_at or customer.created_at
        if not reference_date:
            reference_date = customer.created_at
        
        days_old = (now - reference_date).days
        
        if days_old <= 7:
            bucket = "0-7"
        elif days_old <= 30:
            bucket = "8-30"
        elif days_old <= 60:
            bucket = "31-60"
        else:
            bucket = "60+"
        
        buckets[bucket]["count"] += 1
        buckets[bucket]["total_amount"] += customer.balance
        buckets[bucket]["customers"].append(customer)
    
    # Convert to response format
    bucket_list = [
        AgingBucket(
            bucket=key,
            count=value["count"],
            total_amount=value["total_amount"],
            customers=value["customers"]
        )
        for key, value in buckets.items()
    ]
    
    return AgingReportResponse(
        total_outstanding=total_outstanding,
        buckets=bucket_list
    )


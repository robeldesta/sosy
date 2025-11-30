"""
Credit sales service
"""
from sqlmodel import Session, select, func
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from app.models.invoice import Invoice
from app.models.payment import Payment
from app.services.payment_service import get_total_paid, get_outstanding_balance


def get_customer_credit_summary(
    session: Session,
    business_id: int,
    customer_phone: Optional[str] = None
) -> Dict[str, Any]:
    """
    Get credit summary for a customer or all customers
    
    Returns:
        Dict with total outstanding, invoices list, aging buckets
    """
    # Build query for credit invoices
    conditions = [
        Invoice.business_id == business_id,
        Invoice.payment_mode == "credit",
        Invoice.status.in_(["unpaid", "partial"]),
    ]
    
    if customer_phone:
        conditions.append(Invoice.customer_phone == customer_phone)
    
    statement = select(Invoice).where(*conditions)
    credit_invoices = session.exec(statement).all()
    
    total_outstanding = 0.0
    invoices_data = []
    aging_buckets = {
        "0-30": [],
        "31-60": [],
        "60+": [],
    }
    
    today = datetime.utcnow()
    
    for invoice in credit_invoices:
        outstanding = get_outstanding_balance(session, invoice.id)
        total_outstanding += outstanding
        
        # Calculate aging
        days_old = (today - invoice.created_at).days
        
        invoice_data = {
            "invoice_id": invoice.id,
            "invoice_number": invoice.invoice_number,
            "customer_name": invoice.customer_name,
            "customer_phone": invoice.customer_phone,
            "total": invoice.total,
            "outstanding": outstanding,
            "days_old": days_old,
            "created_at": invoice.created_at.isoformat(),
        }
        invoices_data.append(invoice_data)
        
        # Categorize by aging
        if days_old <= 30:
            aging_buckets["0-30"].append(invoice_data)
        elif days_old <= 60:
            aging_buckets["31-60"].append(invoice_data)
        else:
            aging_buckets["60+"].append(invoice_data)
    
    return {
        "total_outstanding": total_outstanding,
        "invoice_count": len(invoices_data),
        "invoices": invoices_data,
        "aging_buckets": aging_buckets,
    }


def get_all_customers_with_credit(session: Session, business_id: int) -> List[Dict[str, Any]]:
    """Get all customers with outstanding credit"""
    statement = select(Invoice).where(
        Invoice.business_id == business_id,
        Invoice.payment_mode == "credit",
        Invoice.status.in_(["unpaid", "partial"])
    )
    credit_invoices = session.exec(statement).all()
    
    # Group by customer phone
    customers: Dict[str, Dict[str, Any]] = {}
    
    for invoice in credit_invoices:
        phone = invoice.customer_phone or "unknown"
        if phone not in customers:
            customers[phone] = {
                "customer_name": invoice.customer_name,
                "customer_phone": phone,
                "total_outstanding": 0.0,
                "invoice_count": 0,
                "invoices": [],
            }
        
        outstanding = get_outstanding_balance(session, invoice.id)
        customers[phone]["total_outstanding"] += outstanding
        customers[phone]["invoice_count"] += 1
        customers[phone]["invoices"].append({
            "invoice_id": invoice.id,
            "invoice_number": invoice.invoice_number,
            "outstanding": outstanding,
            "created_at": invoice.created_at.isoformat(),
        })
    
    return list(customers.values())


"""
Staff performance insights service (owner only)
"""
from sqlmodel import Session, select, func
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from app.models.invoice import Invoice
from app.models.payment import Payment
from app.models.user import User


def get_staff_insights(
    session: Session,
    business_id: int,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None
) -> List[Dict[str, Any]]:
    """
    Get staff performance insights for a date range
    
    Returns:
        List of staff performance dictionaries
    """
    if not start_date:
        start_date = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    if not end_date:
        end_date = datetime.utcnow().replace(hour=23, minute=59, second=59, microsecond=999999)
    
    # Get all staff users for this business
    staff_statement = select(User).where(
        User.business_id == business_id,
        User.role.in_(["staff", "manager"])
    )
    staff_users = session.exec(staff_statement).all()
    
    insights = []
    
    for user in staff_users:
        # Total sales (from invoices created by this user)
        sales_statement = select(func.sum(Invoice.total)).where(
            Invoice.business_id == business_id,
            Invoice.created_by == user.id,
            Invoice.created_at >= start_date,
            Invoice.created_at <= end_date,
            Invoice.status != "cancelled"
        )
        total_sales = session.exec(sales_statement).first() or 0.0
        
        # Invoice count
        invoice_count_statement = select(func.count(Invoice.id)).where(
            Invoice.business_id == business_id,
            Invoice.created_by == user.id,
            Invoice.created_at >= start_date,
            Invoice.created_at <= end_date,
            Invoice.status != "cancelled"
        )
        invoice_count = session.exec(invoice_count_statement).first() or 0
        
        # Cancelled invoices
        cancelled_statement = select(func.count(Invoice.id)).where(
            Invoice.business_id == business_id,
            Invoice.created_by == user.id,
            Invoice.created_at >= start_date,
            Invoice.created_at <= end_date,
            Invoice.status == "cancelled"
        )
        cancelled_invoices = session.exec(cancelled_statement).first() or 0
        
        # Payments collected (payments recorded by this user)
        payments_statement = select(func.sum(Payment.amount)).join(
            Invoice, Payment.invoice_id == Invoice.id
        ).where(
            Invoice.business_id == business_id,
            Payment.created_by == user.id,
            Payment.payment_date >= start_date,
            Payment.payment_date <= end_date
        )
        payments_collected = session.exec(payments_statement).first() or 0.0
        
        # Average invoice value
        avg_invoice = total_sales / invoice_count if invoice_count > 0 else 0.0
        
        insights.append({
            "user_id": user.id,
            "user_name": f"{user.first_name or ''} {user.last_name or ''}".strip() or user.username or f"User {user.id}",
            "role": user.role,
            "total_sales": total_sales,
            "invoice_count": invoice_count,
            "cancelled_invoices": cancelled_invoices,
            "payments_collected": payments_collected,
            "avg_invoice": avg_invoice,
        })
    
    # Sort by total sales descending
    insights.sort(key=lambda x: x["total_sales"], reverse=True)
    
    return insights


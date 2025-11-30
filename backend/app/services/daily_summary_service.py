"""
Daily summary service for Telegram notifications
"""
from sqlmodel import Session, select, func
from datetime import datetime, timedelta
from typing import Dict, Any, Optional
from app.models.invoice import Invoice
from app.models.payment import Payment
from app.models.expense import Expense
from app.models.product import Product
from app.models.inventory_stock import StockItem
from app.services.stock_search import get_low_stock_products
from app.services.payment_service import get_total_paid


def get_daily_summary(
    session: Session,
    business_id: int,
    date: Optional[datetime] = None
) -> Dict[str, Any]:
    """
    Get daily summary for Telegram notification
    
    Returns:
        Dict with sales, payments, expenses, net cash, top item, low stock count
    """
    if not date:
        date = datetime.utcnow()
    
    start_date = date.replace(hour=0, minute=0, second=0, microsecond=0)
    end_date = date.replace(hour=23, minute=59, second=59, microsecond=999999)
    
    # Total sales (invoice totals)
    sales_statement = select(func.sum(Invoice.total)).where(
        Invoice.business_id == business_id,
        Invoice.created_at >= start_date,
        Invoice.created_at <= end_date,
        Invoice.status != "cancelled"
    )
    total_sales = session.exec(sales_statement).first() or 0.0
    
    # Total payments collected
    from app.models.invoice import Invoice as InvoiceModel
    payments_statement = select(func.sum(Payment.amount)).join(
        InvoiceModel, Payment.invoice_id == InvoiceModel.id
    ).where(
        InvoiceModel.business_id == business_id,
        Payment.payment_date >= start_date,
        Payment.payment_date <= end_date
    )
    total_collected = session.exec(payments_statement).first() or 0.0
    
    # Total expenses
    expenses_statement = select(func.sum(Expense.amount)).where(
        Expense.business_id == business_id,
        Expense.expense_date >= start_date,
        Expense.expense_date <= end_date
    )
    total_expenses = session.exec(expenses_statement).first() or 0.0
    
    # Net cash
    net_cash = total_collected - total_expenses
    
    # Top selling item
    top_item = get_top_selling_item(session, business_id, start_date, end_date)
    
    # Low stock count
    low_stock = get_low_stock_products(session, business_id)
    low_stock_count = len(low_stock)
    
    return {
        "date": date.strftime("%Y-%m-%d"),
        "total_sales": total_sales,
        "total_collected": total_collected,
        "total_expenses": total_expenses,
        "net_cash": net_cash,
        "top_item": top_item,
        "low_stock_count": low_stock_count,
    }


def get_top_selling_item(
    session: Session,
    business_id: int,
    start_date: datetime,
    end_date: datetime
) -> Optional[Dict[str, Any]]:
    """Get top selling item for the day"""
    # Get invoices in date range
    invoices_statement = select(Invoice).where(
        Invoice.business_id == business_id,
        Invoice.created_at >= start_date,
        Invoice.created_at <= end_date,
        Invoice.status != "cancelled"
    )
    invoices = session.exec(invoices_statement).all()
    
    if not invoices:
        return None
    
    # Aggregate by product (simplified - would need to join through invoice items)
    # For now, return first invoice's first item name
    from app.models.invoice_item import InvoiceItem
    items_statement = select(InvoiceItem).where(
        InvoiceItem.invoice_id == invoices[0].id
    ).limit(1)
    item = session.exec(items_statement).first()
    
    if item:
        # Get product name from stock item
        from app.models.stock import LegacyStockItem
        stock_item = session.get(LegacyStockItem, item.stock_item_id)
        if stock_item:
            product = session.get(Product, stock_item.product_id)
            if product:
                return {
                    "name": product.name,
                    "quantity": item.quantity,
                }
    
    return None


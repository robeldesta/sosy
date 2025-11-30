from sqlmodel import Session, select, func
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from app.models.invoice import Invoice
from app.models.purchase import Purchase
from app.models.product import Product
from app.models.inventory_stock import StockItem
from app.models.invoice import InvoiceItem
from app.models.purchase_item import PurchaseItem
from app.models.activity_log import ActivityLog
from app.services.activity_service import get_recent_activity


def get_dashboard_data(session: Session, business_id: int) -> Dict[str, Any]:
    """Get dashboard data for a business"""
    today = datetime.utcnow().date()
    today_start = datetime.combine(today, datetime.min.time())
    today_end = datetime.combine(today, datetime.max.time())
    
    # Today's sales
    today_sales_statement = select(func.sum(Invoice.total)).where(
        Invoice.business_id == business_id,
        Invoice.created_at >= today_start,
        Invoice.created_at <= today_end,
        Invoice.status != "cancelled"
    )
    today_sales = session.exec(today_sales_statement).first() or 0.0
    
    # Today's purchases
    today_purchases_statement = select(func.sum(Purchase.total)).where(
        Purchase.business_id == business_id,
        Purchase.created_at >= today_start,
        Purchase.created_at <= today_end
    )
    today_purchases = session.exec(today_purchases_statement).first() or 0.0
    
    # Low stock products
    low_stock_products = get_low_stock_products(session, business_id)
    
    # Top products last 7 days
    top_products = get_top_products_7_days(session, business_id, limit=5)
    
    # Recent activity
    recent_activity = get_recent_activity(session, business_id, limit=10)
    
    return {
        "today_sales": float(today_sales),
        "today_purchases": float(today_purchases),
        "low_stock": low_stock_products,
        "top_products_7_days": top_products,
        "recent_activity": [
            {
                "id": act.id,
                "timestamp": act.timestamp.isoformat(),
                "action_type": act.action_type,
                "description": act.description,
                "metadata": act.meta_data or {}
            }
            for act in recent_activity
        ]
    }


def get_low_stock_products(session: Session, business_id: int) -> List[Dict[str, Any]]:
    """Get products with low stock"""
    # Get all products for the business
    products_statement = select(Product).where(
        Product.business_id == business_id,
        Product.is_active == True
    )
    products = session.exec(products_statement).all()
    
    low_stock_list = []
    
    for product in products:
        # Get stock for main location
        stock_statement = select(StockItem).where(
            StockItem.product_id == product.id,
            StockItem.location == "main"
        )
        stock_item = session.exec(stock_statement).first()
        
        current_stock = stock_item.quantity if stock_item else 0.0
        reorder_point = product.low_stock_threshold or 0.0
        
        if current_stock <= reorder_point and reorder_point > 0:
            low_stock_list.append({
                "product_id": product.id,
                "product_name": product.name,
                "current_stock": float(current_stock),
                "reorder_point": float(reorder_point),
                "unit_of_measure": product.unit_of_measure
            })
    
    return low_stock_list


def get_top_products_7_days(session: Session, business_id: int, limit: int = 5) -> List[Dict[str, Any]]:
    """Get top selling products in the last 7 days"""
    seven_days_ago = datetime.utcnow() - timedelta(days=7)
    
    # Use inventory movements with type "sale" for accurate tracking
    from app.models.inventory_movement import InventoryMovement
    
    movements_statement = select(InventoryMovement).where(
        InventoryMovement.movement_type == "sale",
        InventoryMovement.created_at >= seven_days_ago
    )
    movements = session.exec(movements_statement).all()
    
    # Get all products for the business to filter
    products_statement = select(Product).where(Product.business_id == business_id)
    business_products = session.exec(products_statement).all()
    business_product_ids = {p.id for p in business_products}
    
    # Aggregate by product
    product_sales: Dict[int, Dict[str, Any]] = {}
    
    for movement in movements:
        if movement.product_id not in business_product_ids:
            continue
        
        product = session.get(Product, movement.product_id)
        if not product:
            continue
        
        if product.id not in product_sales:
            product_sales[product.id] = {
                "product_id": product.id,
                "product_name": product.name,
                "quantity_sold": 0.0,
                "revenue": 0.0  # We don't have revenue from movements, but can estimate
            }
        product_sales[product.id]["quantity_sold"] += movement.quantity
        # Estimate revenue using selling price
        product_sales[product.id]["revenue"] += movement.quantity * product.selling_price
    
    # Sort by quantity sold and return top N
    sorted_products = sorted(
        product_sales.values(),
        key=lambda x: x["quantity_sold"],
        reverse=True
    )
    
    return sorted_products[:limit]


def get_daily_summary(session: Session, business_id: int, date: Optional[datetime] = None) -> Dict[str, Any]:
    """Get daily summary for a specific date (defaults to today)"""
    if date is None:
        date = datetime.utcnow()
    
    date_start = datetime.combine(date.date(), datetime.min.time())
    date_end = datetime.combine(date.date(), datetime.max.time())
    
    # Sales
    sales_statement = select(func.sum(Invoice.total)).where(
        Invoice.business_id == business_id,
        Invoice.created_at >= date_start,
        Invoice.created_at <= date_end,
        Invoice.status != "cancelled"
    )
    sales = session.exec(sales_statement).first() or 0.0
    
    # Purchases
    purchases_statement = select(func.sum(Purchase.total)).where(
        Purchase.business_id == business_id,
        Purchase.created_at >= date_start,
        Purchase.created_at <= date_end
    )
    purchases = session.exec(purchases_statement).first() or 0.0
    
    # Top products
    top_products = get_top_products_7_days(session, business_id, limit=5)
    
    # Low stock count
    low_stock = get_low_stock_products(session, business_id)
    
    return {
        "date": date.date().isoformat(),
        "sales": float(sales),
        "purchases": float(purchases),
        "top_products": top_products,
        "low_stock_count": len(low_stock)
    }


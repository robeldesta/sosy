"""
Stock analytics service
"""
from sqlmodel import Session, select, func
from datetime import datetime, timedelta
from typing import List, Dict, Any
from app.models.product import Product
from app.models.inventory_stock import StockItem
from app.models.inventory_movement import InventoryMovement
from app.models.invoice import Invoice, InvoiceItem


def get_top_selling_items(
    session: Session,
    business_id: int,
    days: int = 30,
    limit: int = 10
) -> List[Dict[str, Any]]:
    """
    Get top selling items in the last N days
    
    Returns:
        List of products with sales data
    """
    cutoff_date = datetime.utcnow() - timedelta(days=days)
    
    # Get all invoices in date range
    invoice_statement = select(Invoice).where(
        Invoice.business_id == business_id,
        Invoice.created_at >= cutoff_date,
        Invoice.status != "cancelled"
    )
    invoices = session.exec(invoice_statement).all()
    invoice_ids = [inv.id for inv in invoices]
    
    if not invoice_ids:
        return []
    
    # Get invoice items
    items_statement = select(InvoiceItem).where(
        InvoiceItem.invoice_id.in_(invoice_ids)
    )
    invoice_items = session.exec(items_statement).all()
    
    # Aggregate by product (via stock_item_id -> product_id)
    product_sales: Dict[int, Dict[str, Any]] = {}
    
    for item in invoice_items:
        # Get product from stock item
        # Note: This assumes stock_item_id maps to product
        # You may need to adjust based on your schema
        product_id = item.stock_item_id  # TODO: Map to actual product_id
        
        if product_id not in product_sales:
            product = session.get(Product, product_id)
            if product:
                product_sales[product_id] = {
                    "product_id": product_id,
                    "product_name": product.name,
                    "quantity_sold": 0.0,
                    "revenue": 0.0,
                }
        
        if product_id in product_sales:
            product_sales[product_id]["quantity_sold"] += item.quantity
            product_sales[product_id]["revenue"] += item.total
    
    # Sort by quantity sold
    top_items = sorted(
        product_sales.values(),
        key=lambda x: x["quantity_sold"],
        reverse=True
    )[:limit]
    
    return top_items


def get_slow_movers(
    session: Session,
    business_id: int,
    days: int = 30,
    min_sales: int = 3
) -> List[Dict[str, Any]]:
    """
    Get items with low sales (slow movers)
    
    Returns:
        List of products with low sales
    """
    cutoff_date = datetime.utcnow() - timedelta(days=days)
    
    # Get all products
    products_statement = select(Product).where(
        Product.business_id == business_id,
        Product.is_active == True
    )
    products = session.exec(products_statement).all()
    
    slow_movers = []
    
    for product in products:
        # Count sales in period
        # This is simplified - you'd need to join through invoice items
        sales_count = 0  # TODO: Implement actual sales count
        
        if sales_count < min_sales:
            stock_statement = select(StockItem).where(StockItem.product_id == product.id)
            stock_item = session.exec(stock_statement).first()
            current_stock = stock_item.quantity if stock_item else 0.0
            
            slow_movers.append({
                "product_id": product.id,
                "product_name": product.name,
                "sales_count": sales_count,
                "current_stock": current_stock,
                "unit": product.unit_of_measure,
            })
    
    return slow_movers


def get_dead_stock(
    session: Session,
    business_id: int,
    days: int = 60
) -> List[Dict[str, Any]]:
    """
    Get items with no movement in N days
    
    Returns:
        List of products with no recent movement
    """
    cutoff_date = datetime.utcnow() - timedelta(days=days)
    
    # Get all products
    products_statement = select(Product).where(
        Product.business_id == business_id,
        Product.is_active == True
    )
    products = session.exec(products_statement).all()
    
    dead_stock = []
    
    for product in products:
        # Check last movement
        movement_statement = select(InventoryMovement).where(
            InventoryMovement.product_id == product.id
        ).order_by(InventoryMovement.created_at.desc()).limit(1)
        
        last_movement = session.exec(movement_statement).first()
        
        if not last_movement or last_movement.created_at < cutoff_date:
            stock_statement = select(StockItem).where(StockItem.product_id == product.id)
            stock_item = session.exec(stock_statement).first()
            current_stock = stock_item.quantity if stock_item else 0.0
            
            dead_stock.append({
                "product_id": product.id,
                "product_name": product.name,
                "current_stock": current_stock,
                "unit": product.unit_of_measure,
                "last_movement": last_movement.created_at.isoformat() if last_movement else None,
            })
    
    return dead_stock


def get_stock_out_risk(
    session: Session,
    business_id: int
) -> List[Dict[str, Any]]:
    """
    Get items at risk of stock-out (current <= min_stock)
    
    Returns:
        List of products at risk
    """
    products_statement = select(Product).where(
        Product.business_id == business_id,
        Product.is_active == True,
        Product.low_stock_threshold.isnot(None)
    )
    products = session.exec(products_statement).all()
    
    at_risk = []
    
    for product in products:
        stock_statement = select(StockItem).where(StockItem.product_id == product.id)
        stock_item = session.exec(stock_statement).first()
        current_stock = stock_item.quantity if stock_item else 0.0
        min_stock = product.low_stock_threshold or 0
        
        if current_stock <= min_stock:
            at_risk.append({
                "product_id": product.id,
                "product_name": product.name,
                "current_stock": current_stock,
                "min_stock": min_stock,
                "unit": product.unit_of_measure,
                "risk_level": "critical" if current_stock == 0 else "low",
            })
    
    return at_risk


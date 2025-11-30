"""
Stock search service with debouncing and highlighting
"""
from sqlmodel import Session, select, or_
from app.models.product import Product
from app.models.inventory_stock import StockItem
from typing import List, Dict, Any
import re


def search_products(
    session: Session,
    business_id: int,
    query: str,
    limit: int = 50
) -> List[Dict[str, Any]]:
    """
    Search products by name, SKU, or barcode
    
    Args:
        session: Database session
        business_id: Business ID
        query: Search query string
        limit: Maximum results
        
    Returns:
        List of products with highlighted matches
    """
    if not query or len(query.strip()) < 1:
        return []
    
    query_lower = query.lower().strip()
    
    # Build search conditions
    conditions = [
        Product.business_id == business_id,
        Product.is_active == True,
        or_(
            Product.name.ilike(f"%{query_lower}%"),
            Product.sku.ilike(f"%{query_lower}%") if Product.sku else False,
            Product.barcode.ilike(f"%{query_lower}%") if Product.barcode else False,
        )
    ]
    
    statement = select(Product).where(*conditions).limit(limit)
    products = session.exec(statement).all()
    
    # Get stock quantities
    results = []
    for product in products:
        # Get current stock
        stock_statement = select(StockItem).where(StockItem.product_id == product.id)
        stock_item = session.exec(stock_statement).first()
        current_stock = stock_item.quantity if stock_item else 0.0
        
        # Find match type and highlight
        match_type = None
        highlighted_name = product.name
        
        if query_lower in product.name.lower():
            match_type = "name"
            highlighted_name = highlight_text(product.name, query)
        elif product.sku and query_lower in product.sku.lower():
            match_type = "sku"
        elif product.barcode and query_lower in product.barcode.lower():
            match_type = "barcode"
        
        results.append({
            "id": product.id,
            "name": product.name,
            "highlighted_name": highlighted_name,
            "sku": product.sku,
            "barcode": product.barcode,
            "unit": product.unit_of_measure,
            "selling_price": product.selling_price,
            "buying_price": product.buying_price,
            "current_stock": current_stock,
            "low_stock_threshold": product.low_stock_threshold,
            "match_type": match_type,
        })
    
    return results


def highlight_text(text: str, query: str) -> str:
    """
    Highlight matching text in HTML format
    
    Args:
        text: Original text
        query: Search query
        
    Returns:
        HTML string with highlighted matches
    """
    if not query:
        return text
    
    # Escape HTML in text
    import html
    text_escaped = html.escape(text)
    
    # Case-insensitive replacement
    pattern = re.compile(re.escape(query), re.IGNORECASE)
    highlighted = pattern.sub(
        lambda m: f'<mark style="background-color: #ffeb3b; padding: 2px 0;">{m.group()}</mark>',
        text_escaped
    )
    
    return highlighted


def get_low_stock_products(session: Session, business_id: int) -> List[Dict[str, Any]]:
    """
    Get products that are at or below low stock threshold
    
    Returns:
        List of products with low stock
    """
    statement = select(Product).where(
        Product.business_id == business_id,
        Product.is_active == True,
        Product.low_stock_threshold.isnot(None)
    )
    products = session.exec(statement).all()
    
    low_stock = []
    for product in products:
        stock_statement = select(StockItem).where(StockItem.product_id == product.id)
        stock_item = session.exec(stock_statement).first()
        current_stock = stock_item.quantity if stock_item else 0.0
        
        if current_stock <= (product.low_stock_threshold or 0):
            low_stock.append({
                "product_id": product.id,
                "product_name": product.name,
                "current_stock": current_stock,
                "min_stock": product.low_stock_threshold,
                "unit": product.unit_of_measure,
                "reorder_quantity": product.reorder_quantity,
            })
    
    return low_stock


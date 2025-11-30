"""
Stock search API endpoints
"""
from fastapi import APIRouter, Depends, Query
from sqlmodel import Session
from typing import List
from app.api.dependencies import get_db, get_current_user
from app.models.user import User
from app.services.business import get_business_by_user_id
from app.services.stock_search import search_products, get_low_stock_products

router = APIRouter(prefix="/stock", tags=["stock"])


@router.get("/search")
async def search_stock(
    q: str = Query(..., min_length=1, description="Search query"),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Search products by name, SKU, or barcode"""
    business = get_business_by_user_id(db, current_user.id)
    if not business:
        return []
    
    results = search_products(db, business.id, q, limit)
    return results


@router.get("/low-stock")
async def get_low_stock(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get products with low stock"""
    business = get_business_by_user_id(db, current_user.id)
    if not business:
        return []
    
    low_stock = get_low_stock_products(db, business.id)
    return low_stock


@router.get("/low-stock/count")
async def get_low_stock_count(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get count of low stock items (for badge)"""
    business = get_business_by_user_id(db, current_user.id)
    if not business:
        return {"count": 0}
    
    low_stock = get_low_stock_products(db, business.id)
    return {"count": len(low_stock)}


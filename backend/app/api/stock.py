from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from typing import List
from app.api.dependencies import get_db, get_current_user
from app.models.user import User
from app.models.stock import LegacyStockItem as StockItem
from app.models.business import Business
from app.schemas.stock import StockItemCreate, StockItemResponse
from app.services.business import get_business_by_user_id

router = APIRouter()


@router.get("", response_model=List[StockItemResponse])
async def get_stock(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all stock items for user's business"""
    business = get_business_by_user_id(db, current_user.id)
    if not business:
        return []
    
    statement = select(StockItem).where(StockItem.business_id == business.id)
    items = db.exec(statement).all()
    return items


@router.post("", response_model=StockItemResponse)
async def create_stock(
    stock_data: StockItemCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new stock item"""
    business = get_business_by_user_id(db, current_user.id)
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")
    
    stock_item = StockItem(**stock_data.model_dump(), business_id=business.id)
    db.add(stock_item)
    db.commit()
    db.refresh(stock_item)
    return stock_item


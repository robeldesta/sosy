from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session
from app.api.dependencies import get_db, get_current_user
from app.models.user import User
from app.schemas.business import BusinessResponse, BusinessCreate, BusinessUpdate
from app.services.business import get_business_by_user_id, create_business, update_business

router = APIRouter()


@router.get("", response_model=BusinessResponse)
async def get_business(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's business information"""
    business = get_business_by_user_id(db, current_user.id)
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")
    return business


@router.put("", response_model=BusinessResponse)
async def update_business_info(
    business_data: BusinessUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update business information"""
    business = get_business_by_user_id(db, current_user.id)
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")
    
    updated_business = update_business(db, business.id, business_data)
    return updated_business


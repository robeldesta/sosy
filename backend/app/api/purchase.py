from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from sqlmodel import Session
from typing import List
from app.api.dependencies import get_db, get_current_user
from app.models.user import User
from app.services.business import get_business_by_user_id
from app.services.purchase_service import (
    create_purchase,
    get_purchase,
    list_purchases,
    mark_purchase_received,
)
from app.services.purchase_pdf import generate_purchase_pdf
from app.schemas.purchase import PurchaseCreate, PurchaseResponse

router = APIRouter(prefix="/purchase", tags=["purchase"])


@router.post("", response_model=PurchaseResponse, status_code=201)
async def create_purchase_endpoint(
    purchase_data: PurchaseCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new purchase"""
    business = get_business_by_user_id(db, current_user.id)
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")
    
    try:
        purchase = create_purchase(db, business.id, purchase_data, user_id=current_user.id)
        return purchase
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating purchase: {str(e)}")


@router.get("", response_model=List[PurchaseResponse])
async def list_purchases_endpoint(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all purchases for user's business"""
    business = get_business_by_user_id(db, current_user.id)
    if not business:
        return []
    
    purchases = list_purchases(db, business.id)
    return purchases


@router.get("/{purchase_id}", response_model=PurchaseResponse)
async def get_purchase_endpoint(
    purchase_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a purchase by ID"""
    business = get_business_by_user_id(db, current_user.id)
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")
    
    purchase = get_purchase(db, purchase_id, business.id)
    if not purchase:
        raise HTTPException(status_code=404, detail="Purchase not found")
    
    return purchase


@router.post("/{purchase_id}/receive", response_model=PurchaseResponse)
async def receive_purchase_endpoint(
    purchase_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mark a purchase as received and update inventory"""
    business = get_business_by_user_id(db, current_user.id)
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")
    
    purchase = mark_purchase_received(db, purchase_id, business.id, user_id=current_user.id)
    if not purchase:
        raise HTTPException(status_code=404, detail="Purchase not found")
    
    return purchase


@router.get("/{purchase_id}/pdf")
async def get_purchase_pdf(
    purchase_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Generate PDF for a purchase (Goods Received Note)"""
    business = get_business_by_user_id(db, current_user.id)
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")
    
    purchase = get_purchase(db, purchase_id, business.id)
    if not purchase:
        raise HTTPException(status_code=404, detail="Purchase not found")
    
    try:
        pdf_bytes = generate_purchase_pdf(db, purchase)
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f'inline; filename="purchase-{purchase.purchase_number}.pdf"'
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating PDF: {str(e)}")



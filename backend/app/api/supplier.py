from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session
from typing import List
from app.api.dependencies import get_db, get_current_user
from app.models.user import User
from app.models.business import Business
from app.services.business import get_business_by_user_id
from app.services.supplier_service import (
    create_supplier,
    get_supplier,
    list_suppliers,
    update_supplier,
    delete_supplier,
)
from app.schemas.supplier import SupplierCreate, SupplierUpdate, SupplierResponse

router = APIRouter(prefix="/suppliers", tags=["suppliers"])


@router.post("", response_model=SupplierResponse, status_code=201)
async def create_supplier_endpoint(
    supplier_data: SupplierCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new supplier"""
    business = get_business_by_user_id(db, current_user.id)
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")
    
    try:
        supplier = create_supplier(db, business.id, supplier_data)
        return supplier
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("", response_model=List[SupplierResponse])
async def list_suppliers_endpoint(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all suppliers for user's business"""
    business = get_business_by_user_id(db, current_user.id)
    if not business:
        return []
    
    suppliers = list_suppliers(db, business.id)
    return suppliers


@router.get("/{supplier_id}", response_model=SupplierResponse)
async def get_supplier_endpoint(
    supplier_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a supplier by ID"""
    business = get_business_by_user_id(db, current_user.id)
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")
    
    supplier = get_supplier(db, supplier_id, business.id)
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    
    return supplier


@router.put("/{supplier_id}", response_model=SupplierResponse)
async def update_supplier_endpoint(
    supplier_id: int,
    supplier_data: SupplierUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a supplier"""
    business = get_business_by_user_id(db, current_user.id)
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")
    
    supplier = update_supplier(db, supplier_id, business.id, supplier_data)
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    
    return supplier


@router.delete("/{supplier_id}", status_code=204)
async def delete_supplier_endpoint(
    supplier_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a supplier"""
    business = get_business_by_user_id(db, current_user.id)
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")
    
    success = delete_supplier(db, supplier_id, business.id)
    if not success:
        raise HTTPException(status_code=404, detail="Supplier not found")
    
    return None



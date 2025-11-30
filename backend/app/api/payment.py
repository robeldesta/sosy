"""
Payment API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session
from typing import List
from app.api.dependencies import get_db, get_current_user
from app.models.user import User
from app.models.invoice import Invoice
from app.services.business import get_business_by_user_id
from app.services.payment_service import (
    create_payment,
    get_invoice_payments,
    get_total_paid,
    get_outstanding_balance,
)
from app.schemas.payment import PaymentCreate, PaymentResponse

router = APIRouter(prefix="/payment", tags=["payment"])


@router.post("", response_model=PaymentResponse, status_code=201)
async def create_payment_endpoint(
    payment_data: PaymentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Record a payment for an invoice"""
    # Verify invoice belongs to user's business
    invoice = db.get(Invoice, payment_data.invoice_id)
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    business = get_business_by_user_id(db, current_user.id)
    if not business or invoice.business_id != business.id:
        raise HTTPException(status_code=403, detail="Invoice does not belong to your business")
    
    # Check if payment amount exceeds outstanding balance
    outstanding = get_outstanding_balance(db, invoice.id)
    if payment_data.amount > outstanding:
        raise HTTPException(
            status_code=400,
            detail=f"Payment amount ({payment_data.amount}) exceeds outstanding balance ({outstanding})"
        )
    
    try:
        payment = create_payment(db, payment_data.invoice_id, payment_data, current_user.id)
        return payment
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/invoice/{invoice_id}", response_model=List[PaymentResponse])
async def get_invoice_payments_endpoint(
    invoice_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all payments for an invoice"""
    invoice = db.get(Invoice, invoice_id)
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    business = get_business_by_user_id(db, current_user.id)
    if not business or invoice.business_id != business.id:
        raise HTTPException(status_code=403, detail="Invoice does not belong to your business")
    
    payments = get_invoice_payments(db, invoice_id)
    return payments


@router.get("/invoice/{invoice_id}/total")
async def get_invoice_total_paid(
    invoice_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get total paid and outstanding balance for an invoice"""
    invoice = db.get(Invoice, invoice_id)
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    business = get_business_by_user_id(db, current_user.id)
    if not business or invoice.business_id != business.id:
        raise HTTPException(status_code=403, detail="Invoice does not belong to your business")
    
    total_paid = get_total_paid(db, invoice_id)
    outstanding = get_outstanding_balance(db, invoice_id)
    
    return {
        "invoice_id": invoice_id,
        "invoice_total": invoice.total,
        "total_paid": total_paid,
        "outstanding_balance": outstanding,
        "status": invoice.status,
    }


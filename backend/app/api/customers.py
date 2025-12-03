"""
Customer API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session
from typing import Optional, List
from app.api.dependencies import get_db, get_current_user
from app.models.user import User
from app.models.business import Business
from app.services.business import get_business_by_user_id
from app.services.customer_service import (
    create_customer,
    get_customer,
    get_customers_by_business,
    update_customer,
    delete_customer,
    get_customer_by_phone,
    get_customer_by_telegram_id
)
from app.services.credit_service import (
    add_credit_entry,
    add_payment_entry,
    get_customer_ledger
)
from app.services.loyalty_service import (
    add_loyalty_entry,
    get_customer_loyalty_history
)
from app.schemas.customer import (
    CustomerCreate,
    CustomerUpdate,
    CustomerResponse,
    CreditEntryCreate,
    PaymentEntryCreate,
    CreditEntryResponse,
    CustomerLedgerResponse,
    LoyaltyEntryCreate,
    LoyaltyEntryResponse
)

router = APIRouter(prefix="/customers", tags=["customers"])


@router.post("", response_model=CustomerResponse)
async def create_customer_endpoint(
    customer_data: CustomerCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new customer"""
    business = get_business_by_user_id(db, current_user.id)
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")
    
    # Check if customer with same phone already exists
    if customer_data.phone:
        existing = get_customer_by_phone(db, business.id, customer_data.phone)
        if existing:
            raise HTTPException(status_code=400, detail="Customer with this phone number already exists")
    
    customer = create_customer(db, business.id, customer_data, current_user.branch_id)
    return customer


@router.get("", response_model=List[CustomerResponse])
async def list_customers_endpoint(
    search: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all customers for the business"""
    business = get_business_by_user_id(db, current_user.id)
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")
    
    customers = get_customers_by_business(db, business.id, current_user.branch_id, search)
    return customers


@router.get("/{customer_id}", response_model=CustomerResponse)
async def get_customer_endpoint(
    customer_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get customer details"""
    customer = get_customer(db, customer_id)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    business = get_business_by_user_id(db, current_user.id)
    if customer.business_id != business.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    return customer


@router.put("/{customer_id}", response_model=CustomerResponse)
async def update_customer_endpoint(
    customer_id: int,
    customer_data: CustomerUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update customer information"""
    customer = get_customer(db, customer_id)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    business = get_business_by_user_id(db, current_user.id)
    if customer.business_id != business.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    updated = update_customer(db, customer_id, customer_data)
    return updated


@router.delete("/{customer_id}")
async def delete_customer_endpoint(
    customer_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete customer (soft delete)"""
    customer = get_customer(db, customer_id)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    business = get_business_by_user_id(db, current_user.id)
    if customer.business_id != business.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    delete_customer(db, customer_id)
    return {"success": True}


@router.post("/credit/add", response_model=CreditEntryResponse)
async def add_credit_endpoint(
    credit_data: CreditEntryCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Add a credit entry (sale on credit)"""
    business = get_business_by_user_id(db, current_user.id)
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")
    
    try:
        entry = add_credit_entry(db, business.id, current_user.id, credit_data)
        return entry
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/payment/add", response_model=CreditEntryResponse)
async def add_payment_endpoint(
    payment_data: PaymentEntryCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Record a payment against customer credit"""
    business = get_business_by_user_id(db, current_user.id)
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")
    
    try:
        entry = add_payment_entry(db, business.id, current_user.id, payment_data)
        return entry
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{customer_id}/ledger", response_model=CustomerLedgerResponse)
async def get_customer_ledger_endpoint(
    customer_id: int,
    limit: int = Query(100, le=500),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get customer credit ledger"""
    customer = get_customer(db, customer_id)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    business = get_business_by_user_id(db, current_user.id)
    if customer.business_id != business.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    entries = get_customer_ledger(db, customer_id, limit)
    
    return CustomerLedgerResponse(
        customer=customer,
        entries=entries,
        current_balance=customer.balance
    )


@router.post("/loyalty/add", response_model=LoyaltyEntryResponse)
async def add_loyalty_entry_endpoint(
    loyalty_data: LoyaltyEntryCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Add a loyalty entry (earned or redeemed)"""
    business = get_business_by_user_id(db, current_user.id)
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")
    
    try:
        entry = add_loyalty_entry(db, business.id, current_user.id, loyalty_data)
        return entry
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{customer_id}/loyalty", response_model=List[LoyaltyEntryResponse])
async def get_customer_loyalty_endpoint(
    customer_id: int,
    limit: int = Query(50, le=200),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get customer loyalty points history"""
    customer = get_customer(db, customer_id)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    business = get_business_by_user_id(db, current_user.id)
    if customer.business_id != business.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    entries = get_customer_loyalty_history(db, customer_id, limit)
    return entries


from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from typing import List
from datetime import datetime
from app.api.dependencies import get_db, get_current_user
from app.models.user import User
from app.models.invoice import Invoice, InvoiceItem
from app.models.stock import StockItem
from app.models.business import Business
from app.schemas.invoice import InvoiceCreate, InvoiceResponse, InvoiceItemResponse
from app.services.business import get_business_by_user_id

router = APIRouter()


def generate_invoice_number(business_id: int) -> str:
    """Generate unique invoice number"""
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    return f"INV-{business_id}-{timestamp}"


@router.get("", response_model=List[InvoiceResponse])
async def get_invoices(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all invoices for user's business"""
    business = get_business_by_user_id(db, current_user.id)
    if not business:
        return []
    
    statement = select(Invoice).where(Invoice.business_id == business.id)
    invoices = db.exec(statement).all()
    return invoices


@router.post("", response_model=InvoiceResponse)
async def create_invoice(
    invoice_data: InvoiceCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new invoice"""
    business = get_business_by_user_id(db, current_user.id)
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")
    
    # Calculate totals
    subtotal = 0.0
    items_data = []
    
    for item_data in invoice_data.items:
        # Get stock item
        stock_item = db.get(StockItem, item_data.stock_item_id)
        if not stock_item:
            raise HTTPException(status_code=404, detail=f"Stock item {item_data.stock_item_id} not found")
        
        # Verify stock item belongs to business
        if stock_item.business_id != business.id:
            raise HTTPException(status_code=403, detail="Stock item does not belong to your business")
        
        item_total = item_data.quantity * item_data.unit_price
        subtotal += item_total
        
        items_data.append({
            "stock_item_id": item_data.stock_item_id,
            "quantity": item_data.quantity,
            "unit_price": item_data.unit_price,
            "total": item_total,
        })
    
    # Calculate tax (15% VAT for Ethiopia)
    tax = subtotal * 0.15
    total = subtotal + tax
    
    # Create invoice
    invoice = Invoice(
        business_id=business.id,
        invoice_number=generate_invoice_number(business.id),
        customer_name=invoice_data.customer_name,
        customer_phone=invoice_data.customer_phone,
        subtotal=subtotal,
        tax=tax,
        total=total,
        status="draft",
    )
    db.add(invoice)
    db.commit()
    db.refresh(invoice)
    
    # Create invoice items
    for item_data in items_data:
        invoice_item = InvoiceItem(
            invoice_id=invoice.id,
            **item_data
        )
        db.add(invoice_item)
    
    db.commit()
    db.refresh(invoice)
    
    return invoice


from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from typing import List
from datetime import datetime
from app.api.dependencies import get_db, get_current_user
from app.models.user import User
from app.models.invoice import Invoice, InvoiceItem
from app.models.stock import LegacyStockItem as StockItem
from app.models.business import Business
from app.schemas.invoice import InvoiceBase, InvoiceResponse, InvoiceItemResponse
from app.services.business import get_business_by_user_id
from app.services.invoice import create_invoice as create_invoice_service
from app.services.pdf_templates import generate_invoice_pdf
from app.api.middleware.subscription import require_active_subscription, allow_expired_read
from app.services.subscription_service import check_subscription_limit
from fastapi.responses import StreamingResponse

router = APIRouter()


def generate_invoice_number(business_id: int) -> str:
    """Generate unique invoice number"""
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    return f"INV-{business_id}-{timestamp}"


@router.get("", response_model=List[InvoiceResponse])
async def get_invoices(
    current_user: User = Depends(allow_expired_read),
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
async def create_invoice_endpoint(
    invoice_data: InvoiceBase,
    current_user: User = Depends(require_active_subscription),
    db: Session = Depends(get_db)
):
    """Create a new invoice"""
    
    business = get_business_by_user_id(db, current_user.id)
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")
    
    # Check invoice limit
    has_limit, max_invoices = check_subscription_limit(db, current_user.id, "invoices")
    if has_limit and max_invoices is not None:
        # Count existing invoices
        from sqlmodel import select, func
        count_statement = select(func.count(Invoice.id)).where(Invoice.business_id == business.id)
        current_count = db.exec(count_statement).first() or 0
        if current_count >= max_invoices:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Invoice limit reached ({max_invoices}). Please upgrade your plan."
            )
    
    # Use service function
    invoice = create_invoice_service(
        session=db,
        business_id=business.id,
        invoice_data=invoice_data,
        created_by=current_user.id,
        template=invoice_data.template
    )
    
    return invoice


@router.get("/{invoice_id}", response_model=InvoiceResponse)
async def get_invoice(
    invoice_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific invoice"""
    business = get_business_by_user_id(db, current_user.id)
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")
    
    invoice = db.get(Invoice, invoice_id)
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    if invoice.business_id != business.id:
        raise HTTPException(status_code=403, detail="Invoice does not belong to your business")
    
    # Load invoice items
    statement = select(InvoiceItem).where(InvoiceItem.invoice_id == invoice.id)
    items = db.exec(statement).all()
    
    # Create response with items
    invoice_response = InvoiceResponse(
        id=invoice.id,
        business_id=invoice.business_id,
        invoice_number=invoice.invoice_number,
        customer_name=invoice.customer_name,
        customer_phone=invoice.customer_phone,
        items=[InvoiceItemResponse(
            id=item.id,
            invoice_id=item.invoice_id,
            stock_item_id=item.stock_item_id,
            quantity=item.quantity,
            unit_price=item.unit_price,
            total=item.total,
        ) for item in items],
        subtotal=invoice.subtotal,
        tax=invoice.tax,
        total=invoice.total,
        status=invoice.status,
        created_at=invoice.created_at,
        updated_at=invoice.updated_at,
    )
    
    return invoice_response


@router.post("/{invoice_id}/pay", response_model=InvoiceResponse)
async def mark_invoice_as_paid(
    invoice_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mark an invoice as paid"""
    business = get_business_by_user_id(db, current_user.id)
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")
    
    invoice = db.get(Invoice, invoice_id)
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    if invoice.business_id != business.id:
        raise HTTPException(status_code=403, detail="Invoice does not belong to your business")
    
    invoice.status = "paid"
    db.add(invoice)
    db.commit()
    db.refresh(invoice)
    
    # Load invoice items
    statement = select(InvoiceItem).where(InvoiceItem.invoice_id == invoice.id)
    items = db.exec(statement).all()
    
    return InvoiceResponse(
        id=invoice.id,
        business_id=invoice.business_id,
        invoice_number=invoice.invoice_number,
        customer_name=invoice.customer_name,
        customer_phone=invoice.customer_phone,
        items=[InvoiceItemResponse(
            id=item.id,
            invoice_id=item.invoice_id,
            stock_item_id=item.stock_item_id,
            quantity=item.quantity,
            unit_price=item.unit_price,
            total=item.total,
        ) for item in items],
        subtotal=invoice.subtotal,
        tax=invoice.tax,
        total=invoice.total,
        status=invoice.status,
        created_at=invoice.created_at,
        updated_at=invoice.updated_at,
    )


@router.get("/{invoice_id}/pdf")
async def get_invoice_pdf(
    invoice_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Generate PDF for an invoice"""
    from fastapi.responses import StreamingResponse
    
    business = get_business_by_user_id(db, current_user.id)
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")
    
    invoice = db.get(Invoice, invoice_id)
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    if invoice.business_id != business.id:
        raise HTTPException(status_code=403, detail="Invoice does not belong to your business")
    
    # Generate PDF using template
    pdf_buffer = generate_invoice_pdf(invoice, business, template=invoice.template)
    pdf_buffer.seek(0)
    
    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"inline; filename=invoice_{invoice.invoice_number}.pdf"
        }
    )


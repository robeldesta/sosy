from sqlmodel import Session, select
from app.models.invoice import Invoice, InvoiceItem
from app.models.invoice_audit import InvoiceAuditLog
from app.models.stock import LegacyStockItem as StockItem
from app.schemas.invoice import InvoiceBase
from app.services.invoice_numbering import generate_invoice_number
from app.services.cashbook_service import create_cashbook_entry
from app.services.activity_service import log_invoice_created, log_activity
from datetime import datetime
from typing import Optional


def create_invoice(
    session: Session,
    business_id: int,
    invoice_data: InvoiceBase,
    created_by: Optional[int] = None,
    template: Optional[str] = None
) -> Invoice:
    """Create a new invoice with items"""
    # Calculate totals
    subtotal = 0.0
    items_data = []
    
    for item_data in invoice_data.items:
        # Get stock item
        stock_item = session.get(StockItem, item_data.stock_item_id)
        if not stock_item:
            raise ValueError(f"Stock item {item_data.stock_item_id} not found")
        
        # Verify stock item belongs to business
        if stock_item.business_id != business_id:
            raise ValueError("Stock item does not belong to your business")
        
        item_total = item_data.quantity * item_data.unit_price
        subtotal += item_total
        
        items_data.append({
            "stock_item_id": item_data.stock_item_id,
            "quantity": item_data.quantity,
            "unit_price": item_data.unit_price,
            "total": item_total,
        })
    
    # Calculate discount
    discount = invoice_data.discount if hasattr(invoice_data, 'discount') else 0.0
    subtotal_after_discount = subtotal - discount
    
    # Calculate tax (15% VAT for Ethiopia) on discounted amount
    tax = subtotal_after_discount * 0.15
    total = subtotal_after_discount + tax
    
    # Generate invoice number
    invoice_number = generate_invoice_number(session, business_id)
    
    # Determine payment mode and initial status
    payment_mode = invoice_data.payment_mode or "cash"
    initial_status = "unpaid" if payment_mode == "credit" else "draft"
    invoice_template = template or invoice_data.template or "simple"
    
    # Create invoice
    invoice = Invoice(
        business_id=business_id,
        invoice_number=invoice_number,
        customer_name=invoice_data.customer_name,
        customer_phone=invoice_data.customer_phone,
        subtotal=subtotal,
        discount=discount,
        tax=tax,
        total=total,
        status=initial_status,
        payment_mode=payment_mode,
        template=invoice_template,
        created_by=created_by,
    )
    session.add(invoice)
    session.commit()
    session.refresh(invoice)
    
    # Create invoice items
    for item_data in items_data:
        invoice_item = InvoiceItem(
            invoice_id=invoice.id,
            **item_data
        )
        session.add(invoice_item)
    
    # Create audit log entry
    audit_log = InvoiceAuditLog(
        invoice_id=invoice.id,
        action="created",
        new_status="draft",
        changed_by=created_by,
        notes="Invoice created"
    )
    session.add(audit_log)
    
    # Log activity
    log_invoice_created(
        session=session,
        business_id=business_id,
        invoice_id=invoice.id,
        invoice_number=invoice.invoice_number,
        user_id=created_by
    )
    
    # Create cashbook entry if invoice is paid
    if invoice.status == "paid":
        create_cashbook_entry(
            session=session,
            business_id=business_id,
            entry_type="payment_in",
            amount=invoice.total,
            description=f"Payment for invoice {invoice.invoice_number}",
            payment_method="cash",  # Default, can be updated when payment is recorded
            reference_id=invoice.id,
            reference_type="invoice",
            user_id=created_by
        )
    
    session.commit()
    session.refresh(invoice)
    
    return invoice


def get_invoices_by_business(session: Session, business_id: int) -> list[Invoice]:
    """Get all invoices for a business"""
    statement = select(Invoice).where(Invoice.business_id == business_id)
    return list(session.exec(statement).all())


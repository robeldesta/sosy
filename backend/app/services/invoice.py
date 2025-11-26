from sqlmodel import Session, select
from app.models.invoice import Invoice, InvoiceItem
from app.models.stock import StockItem
from app.schemas.invoice import InvoiceCreate
from datetime import datetime


def generate_invoice_number(business_id: int) -> str:
    """Generate unique invoice number"""
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    return f"INV-{business_id}-{timestamp}"


def create_invoice(session: Session, business_id: int, invoice_data: InvoiceCreate) -> Invoice:
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
    
    # Calculate tax (15% VAT for Ethiopia)
    tax = subtotal * 0.15
    total = subtotal + tax
    
    # Create invoice
    invoice = Invoice(
        business_id=business_id,
        invoice_number=generate_invoice_number(business_id),
        customer_name=invoice_data.customer_name,
        customer_phone=invoice_data.customer_phone,
        subtotal=subtotal,
        tax=tax,
        total=total,
        status="draft",
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
    
    session.commit()
    session.refresh(invoice)
    
    return invoice


def get_invoices_by_business(session: Session, business_id: int) -> list[Invoice]:
    """Get all invoices for a business"""
    statement = select(Invoice).where(Invoice.business_id == business_id)
    return list(session.exec(statement).all())


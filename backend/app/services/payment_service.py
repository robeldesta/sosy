"""
Payment service
"""
from sqlmodel import Session, select, func
from app.models.payment import Payment
from app.models.invoice import Invoice
from app.schemas.payment import PaymentCreate
from typing import Optional


def create_payment(
    session: Session,
    invoice_id: int,
    payment_data: PaymentCreate,
    user_id: Optional[int] = None
) -> Payment:
    """Create a payment and update invoice status"""
    # Get invoice
    invoice = session.get(Invoice, invoice_id)
    if not invoice:
        raise ValueError(f"Invoice {invoice_id} not found")
    
    # Create payment
    payment = Payment(
        invoice_id=invoice_id,
        amount=payment_data.amount,
        payment_method=payment_data.payment_method,
        bank_name=payment_data.bank_name,
        payment_date=payment_data.payment_date,
        notes=payment_data.notes,
        created_by=user_id,
    )
    session.add(payment)
    session.commit()
    session.refresh(payment)
    
    # Calculate total paid
    payments_statement = select(func.sum(Payment.amount)).where(
        Payment.invoice_id == invoice_id
    )
    total_paid = session.exec(payments_statement).first() or 0.0
    
    # Update invoice status
    if total_paid >= invoice.total:
        invoice.status = "paid"
    elif total_paid > 0:
        invoice.status = "partial"
    else:
        invoice.status = "unpaid"
    
    session.add(invoice)
    session.commit()
    session.refresh(invoice)
    
    # Log activity
    log_payment_added(
        session=session,
        business_id=invoice.business_id,
        invoice_id=invoice_id,
        payment_id=payment.id,
        amount=payment.amount,
        user_id=user_id
    )
    
    # Create cashbook entry
    from app.services.cashbook_service import create_cashbook_entry
    create_cashbook_entry(
        session=session,
        business_id=invoice.business_id,
        entry_type="payment_in",
        amount=payment_data.amount,
        description=f"Payment for invoice {invoice.invoice_number}",
        payment_method=payment_data.payment_method,
        reference_id=invoice.id,
        reference_type="invoice",
        user_id=user_id
    )
    
    return payment


def get_invoice_payments(session: Session, invoice_id: int) -> list[Payment]:
    """Get all payments for an invoice"""
    statement = select(Payment).where(
        Payment.invoice_id == invoice_id
    ).order_by(Payment.payment_date.desc())
    return list(session.exec(statement).all())


def get_total_paid(session: Session, invoice_id: int) -> float:
    """Get total amount paid for an invoice"""
    statement = select(func.sum(Payment.amount)).where(
        Payment.invoice_id == invoice_id
    )
    total = session.exec(statement).first()
    return total or 0.0


def get_outstanding_balance(session: Session, invoice_id: int) -> float:
    """Get outstanding balance for an invoice"""
    invoice = session.get(Invoice, invoice_id)
    if not invoice:
        return 0.0
    
    total_paid = get_total_paid(session, invoice_id)
    return max(0.0, invoice.total - total_paid)


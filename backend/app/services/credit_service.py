"""
Credit service for managing customer credit entries and balances
"""
from sqlmodel import Session, select
from typing import Optional, List
from datetime import datetime
from app.models.customer import Customer
from app.models.customer_credit import CustomerCreditEntry
from app.schemas.customer import CreditEntryCreate, PaymentEntryCreate


def add_credit_entry(
    session: Session,
    business_id: int,
    user_id: int,
    credit_data: CreditEntryCreate
) -> CustomerCreditEntry:
    """
    Add a credit entry (sale on credit) and update customer balance
    
    This is atomic - balance update happens in the same transaction
    """
    customer = session.get(Customer, credit_data.customer_id)
    if not customer or customer.business_id != business_id:
        raise ValueError("Customer not found")
    
    # Calculate new balance
    new_balance = customer.balance + credit_data.amount
    
    # Create credit entry
    credit_entry = CustomerCreditEntry(
        customer_id=credit_data.customer_id,
        business_id=business_id,
        sale_id=credit_data.sale_id,
        invoice_id=credit_data.invoice_id,
        entry_type="credit",
        amount=credit_data.amount,
        balance_after=new_balance,
        reference=credit_data.reference,
        notes=credit_data.notes,
        created_by=user_id
    )
    
    # Update customer balance atomically
    customer.total_credit += credit_data.amount
    customer.balance = new_balance
    customer.is_settled = (new_balance == 0)
    customer.last_sale_at = datetime.utcnow()
    customer.updated_at = datetime.utcnow()
    
    session.add(credit_entry)
    session.add(customer)
    session.commit()
    session.refresh(credit_entry)
    
    return credit_entry


def add_payment_entry(
    session: Session,
    business_id: int,
    user_id: int,
    payment_data: PaymentEntryCreate
) -> CustomerCreditEntry:
    """
    Add a payment entry and update customer balance
    
    This is atomic - balance update happens in the same transaction
    """
    customer = session.get(Customer, payment_data.customer_id)
    if not customer or customer.business_id != business_id:
        raise ValueError("Customer not found")
    
    # Validate payment doesn't exceed balance
    if payment_data.amount > customer.balance:
        raise ValueError(f"Payment amount ({payment_data.amount}) exceeds balance ({customer.balance})")
    
    # Calculate new balance
    new_balance = customer.balance - payment_data.amount
    
    # Create payment entry
    payment_entry = CustomerCreditEntry(
        customer_id=payment_data.customer_id,
        business_id=business_id,
        entry_type="payment",
        amount=payment_data.amount,
        balance_after=new_balance,
        payment_method=payment_data.payment_method,
        reference=payment_data.reference,
        notes=payment_data.notes,
        created_by=user_id
    )
    
    # Update customer balance atomically
    customer.total_paid += payment_data.amount
    customer.balance = new_balance
    customer.is_settled = (new_balance == 0)
    customer.last_payment_at = datetime.utcnow()
    customer.updated_at = datetime.utcnow()
    
    session.add(payment_entry)
    session.add(customer)
    session.commit()
    session.refresh(payment_entry)
    
    return payment_entry


def get_customer_ledger(session: Session, customer_id: int, limit: int = 100) -> List[CustomerCreditEntry]:
    """Get customer credit ledger entries"""
    statement = select(CustomerCreditEntry).where(
        CustomerCreditEntry.customer_id == customer_id
    ).order_by(CustomerCreditEntry.created_at.desc()).limit(limit)
    
    return list(session.exec(statement).all())


def recalculate_customer_balance(session: Session, customer_id: int) -> Customer:
    """
    Recalculate customer balance from all credit entries
    Useful for data integrity checks
    """
    customer = session.get(Customer, customer_id)
    if not customer:
        raise ValueError("Customer not found")
    
    # Sum all credit entries
    credit_statement = select(func.sum(CustomerCreditEntry.amount)).where(
        CustomerCreditEntry.customer_id == customer_id,
        CustomerCreditEntry.entry_type == "credit"
    )
    total_credit = session.exec(credit_statement).first() or 0.0
    
    # Sum all payment entries
    payment_statement = select(func.sum(CustomerCreditEntry.amount)).where(
        CustomerCreditEntry.customer_id == customer_id,
        CustomerCreditEntry.entry_type == "payment"
    )
    total_paid = session.exec(payment_statement).first() or 0.0
    
    # Update customer
    customer.total_credit = total_credit
    customer.total_paid = total_paid
    customer.balance = total_credit - total_paid
    customer.is_settled = (customer.balance == 0)
    customer.updated_at = datetime.utcnow()
    
    session.add(customer)
    session.commit()
    session.refresh(customer)
    
    return customer

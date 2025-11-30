"""
Cashbook service
"""
from sqlmodel import Session, select, func
from datetime import datetime, timedelta
from typing import Optional, Dict, List
from app.models.cashbook import CashbookEntry, CashReconciliation
from app.models.payment import Payment
from app.models.expense import Expense
from app.schemas.cashbook import CashReconciliationCreate
from app.services.payment_service import get_total_paid


def create_cashbook_entry(
    session: Session,
    business_id: int,
    entry_type: str,
    amount: float,
    description: str,
    payment_method: Optional[str] = None,
    reference_id: Optional[int] = None,
    reference_type: Optional[str] = None,
    user_id: Optional[int] = None
) -> CashbookEntry:
    """Create a cashbook entry"""
    entry = CashbookEntry(
        business_id=business_id,
        entry_type=entry_type,
        amount=amount,
        payment_method=payment_method,
        reference_id=reference_id,
        reference_type=reference_type,
        description=description,
        created_by=user_id,
    )
    session.add(entry)
    session.commit()
    session.refresh(entry)
    return entry


def get_cashbook_summary(
    session: Session,
    business_id: int,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None
) -> Dict:
    """Get cashbook summary for date range"""
    if not start_date:
        start_date = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    if not end_date:
        end_date = datetime.utcnow().replace(hour=23, minute=59, second=59, microsecond=999999)
    
    # Get cash in (payments) - need to join properly
    from app.models.invoice import Invoice
    payments_statement = select(func.sum(Payment.amount)).join(
        Invoice, Payment.invoice_id == Invoice.id
    ).where(
        Invoice.business_id == business_id,
        Payment.payment_date >= start_date,
        Payment.payment_date <= end_date
    )
    cash_in = session.exec(payments_statement).first() or 0.0
    
    # Get cash out (expenses)
    expenses_statement = select(func.sum(Expense.amount)).where(
        Expense.business_id == business_id,
        Expense.expense_date >= start_date,
        Expense.expense_date <= end_date,
        Expense.payment_method == "cash"  # Only cash expenses affect cashbook
    )
    cash_out = session.exec(expenses_statement).first() or 0.0
    
    # Get entries
    entries_statement = select(CashbookEntry).where(
        CashbookEntry.business_id == business_id,
        CashbookEntry.entry_date >= start_date,
        CashbookEntry.entry_date <= end_date
    ).order_by(CashbookEntry.entry_date.desc())
    entries = list(session.exec(entries_statement).all())
    
    # Calculate by payment method
    cash_by_method = {
        "cash": 0.0,
        "telebirr": 0.0,
        "bank": 0.0,
        "other": 0.0,
    }
    
    # Sum payments by method
    for entry in entries:
        if entry.entry_type == "payment_in" and entry.payment_method:
            method = entry.payment_method.lower()
            if method in cash_by_method:
                cash_by_method[method] += entry.amount
    
    return {
        "cash_in": cash_in,
        "cash_out": cash_out,
        "net_cash": cash_in - cash_out,
        "cash_by_method": cash_by_method,
        "entries": entries,
    }


def reconcile_cash(
    session: Session,
    business_id: int,
    reconciliation_data: CashReconciliationCreate,
    user_id: Optional[int] = None
) -> CashReconciliation:
    """Reconcile cash - compare expected vs actual"""
    # Calculate expected cash
    today = reconciliation_data.reconciliation_date or datetime.utcnow()
    start_date = today.replace(hour=0, minute=0, second=0, microsecond=0)
    end_date = today.replace(hour=23, minute=59, second=59, microsecond=999999)
    
    summary = get_cashbook_summary(session, business_id, start_date, end_date)
    expected_cash = summary["net_cash"]
    actual_cash = reconciliation_data.actual_cash
    difference = actual_cash - expected_cash
    
    # Create reconciliation record
    reconciliation = CashReconciliation(
        business_id=business_id,
        reconciliation_date=today,
        expected_cash=expected_cash,
        actual_cash=actual_cash,
        difference=difference,
        adjustment_amount=difference,
        adjustment_reason=reconciliation_data.adjustment_reason,
        notes=reconciliation_data.notes,
        reconciled_by=user_id,
    )
    session.add(reconciliation)
    
    # Create adjustment entry if difference exists
    if abs(difference) > 0.01:  # Only if significant difference
        adjustment_entry = CashbookEntry(
            business_id=business_id,
            entry_type="adjustment",
            amount=difference,
            description=f"Cash reconciliation adjustment: {reconciliation_data.adjustment_reason or 'Difference found'}",
            payment_method="cash",
            reference_type="reconciliation",
            reference_id=None,  # Will be set after reconciliation is saved
            created_by=user_id,
        )
        session.add(adjustment_entry)
        session.commit()
        session.refresh(reconciliation)
        session.refresh(adjustment_entry)
        
        # Update reference_id
        adjustment_entry.reference_id = reconciliation.id
        session.add(adjustment_entry)
    
    session.commit()
    session.refresh(reconciliation)
    
    return reconciliation


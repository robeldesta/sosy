"""
Invoice numbering service with date-based sequence
"""
from sqlmodel import SQLModel, Session, select, Field
from datetime import datetime
from typing import Optional
import threading

# Thread-safe lock for invoice number generation
_invoice_lock = threading.Lock()


class InvoiceSequence(SQLModel, table=True):
    """Tracks daily invoice sequence per business"""
    id: Optional[int] = Field(default=None, primary_key=True)
    business_id: int = Field(foreign_key="business.id", index=True)
    date: str = Field(index=True)  # YYYYMMDD format
    sequence: int = Field(default=0)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


def generate_invoice_number(session: Session, business_id: int) -> str:
    """
    Generate invoice number in format: INV-YYYYMMDD-XXXX
    
    Args:
        session: Database session
        business_id: Business ID
        
    Returns:
        Invoice number string
    """
    with _invoice_lock:
        today = datetime.utcnow()
        date_str = today.strftime("%Y%m%d")
        
        # Get or create sequence for today
        statement = select(InvoiceSequence).where(
            InvoiceSequence.business_id == business_id,
            InvoiceSequence.date == date_str
        )
        sequence_record = session.exec(statement).first()
        
        if not sequence_record:
            # Create new sequence for today
            sequence_record = InvoiceSequence(
                business_id=business_id,
                date=date_str,
                sequence=0
            )
            session.add(sequence_record)
            session.commit()
            session.refresh(sequence_record)
        
        # Increment sequence atomically
        sequence_record.sequence += 1
        session.add(sequence_record)
        session.commit()
        session.refresh(sequence_record)
        
        # Format: INV-YYYYMMDD-XXXX (4-digit sequence)
        sequence_str = f"{sequence_record.sequence:04d}"
        invoice_number = f"INV-{date_str}-{sequence_str}"
        
        return invoice_number


def reserve_invoice_numbers(session: Session, business_id: int, count: int = 5) -> list[str]:
    """
    Reserve multiple invoice numbers for offline use
    
    Args:
        session: Database session
        business_id: Business ID
        count: Number of numbers to reserve
        
    Returns:
        List of reserved invoice numbers
    """
    with _invoice_lock:
        today = datetime.utcnow()
        date_str = today.strftime("%Y%m%d")
        
        # Get or create sequence for today
        statement = select(InvoiceSequence).where(
            InvoiceSequence.business_id == business_id,
            InvoiceSequence.date == date_str
        )
        sequence_record = session.exec(statement).first()
        
        if not sequence_record:
            sequence_record = InvoiceSequence(
                business_id=business_id,
                date=date_str,
                sequence=0
            )
            session.add(sequence_record)
            session.commit()
            session.refresh(sequence_record)
        
        # Reserve numbers
        reserved_numbers = []
        start_sequence = sequence_record.sequence + 1
        
        for i in range(count):
            sequence_record.sequence += 1
            sequence_str = f"{sequence_record.sequence:04d}"
            invoice_number = f"INV-{date_str}-{sequence_str}"
            reserved_numbers.append(invoice_number)
        
        session.add(sequence_record)
        session.commit()
        
        return reserved_numbers


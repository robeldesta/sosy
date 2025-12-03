"""
Loyalty service for managing customer loyalty points
"""
from sqlmodel import Session, select
from typing import Optional
from datetime import datetime
from app.models.customer import Customer
from app.models.customer_loyalty import CustomerLoyaltyEntry
from app.schemas.customer import LoyaltyEntryCreate


def add_loyalty_entry(
    session: Session,
    business_id: int,
    user_id: int,
    loyalty_data: LoyaltyEntryCreate
) -> CustomerLoyaltyEntry:
    """
    Add a loyalty entry (earned or redeemed) and update customer points
    
    This is atomic - points update happens in the same transaction
    """
    customer = session.get(Customer, loyalty_data.customer_id)
    if not customer or customer.business_id != business_id:
        raise ValueError("Customer not found")
    
    # Calculate new points balance
    if loyalty_data.entry_type == "earned":
        new_points = customer.loyalty_points + loyalty_data.points
    elif loyalty_data.entry_type == "redeemed":
        if loyalty_data.points > customer.loyalty_points:
            raise ValueError(f"Redeeming {loyalty_data.points} points exceeds balance ({customer.loyalty_points})")
        new_points = customer.loyalty_points - loyalty_data.points
    else:
        raise ValueError(f"Invalid entry_type: {loyalty_data.entry_type}")
    
    # Create loyalty entry
    loyalty_entry = CustomerLoyaltyEntry(
        customer_id=loyalty_data.customer_id,
        business_id=business_id,
        sale_id=loyalty_data.sale_id,
        invoice_id=loyalty_data.invoice_id,
        entry_type=loyalty_data.entry_type,
        points=loyalty_data.points,
        points_after=new_points,
        redemption_type=loyalty_data.redemption_type,
        redemption_value=loyalty_data.redemption_value,
        notes=loyalty_data.notes,
        created_by=user_id
    )
    
    # Update customer points atomically
    customer.loyalty_points = new_points
    customer.updated_at = datetime.utcnow()
    
    session.add(loyalty_entry)
    session.add(customer)
    session.commit()
    session.refresh(loyalty_entry)
    
    return loyalty_entry


def calculate_loyalty_points(sale_amount: float, points_per_etb: float = 0.01) -> float:
    """
    Calculate loyalty points from sale amount
    Default: 1 point per 100 ETB (0.01 points per ETB)
    """
    return round(sale_amount * points_per_etb, 2)


def get_customer_loyalty_history(session: Session, customer_id: int, limit: int = 50) -> list[CustomerLoyaltyEntry]:
    """Get customer loyalty points history"""
    statement = select(CustomerLoyaltyEntry).where(
        CustomerLoyaltyEntry.customer_id == customer_id
    ).order_by(CustomerLoyaltyEntry.created_at.desc()).limit(limit)
    
    return list(session.exec(statement).all())


"""
Customer service for managing customer accounts
"""
from sqlmodel import Session, select, func
from typing import Optional, List
from datetime import datetime
from app.models.customer import Customer
from app.models.customer_credit import CustomerCreditEntry
from app.models.customer_loyalty import CustomerLoyaltyEntry
from app.schemas.customer import CustomerCreate, CustomerUpdate


def create_customer(session: Session, business_id: int, customer_data: CustomerCreate, branch_id: Optional[int] = None) -> Customer:
    """Create a new customer"""
    customer = Customer(
        business_id=business_id,
        branch_id=branch_id,
        **customer_data.model_dump()
    )
    session.add(customer)
    session.commit()
    session.refresh(customer)
    return customer


def get_customer(session: Session, customer_id: int) -> Optional[Customer]:
    """Get customer by ID"""
    return session.get(Customer, customer_id)


def get_customers_by_business(session: Session, business_id: int, branch_id: Optional[int] = None, search: Optional[str] = None) -> List[Customer]:
    """Get all customers for a business"""
    statement = select(Customer).where(Customer.business_id == business_id)
    
    if branch_id:
        statement = statement.where(Customer.branch_id == branch_id)
    
    if search:
        search_term = f"%{search}%"
        statement = statement.where(
            (Customer.name.ilike(search_term)) |
            (Customer.phone.ilike(search_term))
        )
    
    statement = statement.order_by(Customer.name)
    return list(session.exec(statement).all())


def update_customer(session: Session, customer_id: int, customer_data: CustomerUpdate) -> Customer:
    """Update customer information"""
    customer = session.get(Customer, customer_id)
    if not customer:
        raise ValueError("Customer not found")
    
    update_data = customer_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(customer, field, value)
    
    customer.updated_at = datetime.utcnow()
    session.add(customer)
    session.commit()
    session.refresh(customer)
    return customer


def delete_customer(session: Session, customer_id: int) -> bool:
    """Delete customer (soft delete by setting is_active=False)"""
    customer = session.get(Customer, customer_id)
    if not customer:
        return False
    
    customer.is_active = False
    customer.updated_at = datetime.utcnow()
    session.add(customer)
    session.commit()
    return True


def get_customer_by_phone(session: Session, business_id: int, phone: str) -> Optional[Customer]:
    """Get customer by phone number"""
    statement = select(Customer).where(
        Customer.business_id == business_id,
        Customer.phone == phone,
        Customer.is_active == True
    )
    return session.exec(statement).first()


def get_customer_by_telegram_id(session: Session, business_id: int, telegram_user_id: int) -> Optional[Customer]:
    """Get customer by Telegram user ID"""
    statement = select(Customer).where(
        Customer.business_id == business_id,
        Customer.telegram_user_id == telegram_user_id,
        Customer.is_active == True
    )
    return session.exec(statement).first()


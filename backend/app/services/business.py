from sqlmodel import Session, select
from app.models.business import Business
from app.models.user import User
from app.schemas.business import BusinessCreate, BusinessUpdate


def get_business_by_user_id(session: Session, user_id: int) -> Business | None:
    """Get business for a user"""
    statement = select(Business).where(Business.user_id == user_id)
    return session.exec(statement).first()


def create_business(session: Session, user_id: int, business_data: BusinessCreate) -> Business:
    """Create a new business"""
    business = Business(**business_data.model_dump(), user_id=user_id)
    session.add(business)
    session.commit()
    session.refresh(business)
    return business


def update_business(session: Session, business_id: int, business_data: BusinessUpdate) -> Business:
    """Update business information"""
    business = session.get(Business, business_id)
    if not business:
        raise ValueError("Business not found")
    
    update_data = business_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(business, field, value)
    
    session.add(business)
    session.commit()
    session.refresh(business)
    return business


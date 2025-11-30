"""
Invite service for staff onboarding
"""
import secrets
from sqlmodel import Session, select
from datetime import datetime, timedelta
from typing import Optional
from app.models.invite import Invite
from app.models.user import User
from app.models.branch import Branch


def generate_invite_code() -> str:
    """Generate a unique 8-character invite code"""
    return secrets.token_urlsafe(6).upper()[:8]


def create_invite(
    session: Session,
    business_id: int,
    role: str = "staff",
    branch_id: Optional[int] = None,
    created_by: Optional[int] = None,
    expires_in_hours: int = 24
) -> Invite:
    """
    Create a new invite
    
    Args:
        session: Database session
        business_id: Business ID
        role: Role to assign (owner, manager, staff)
        branch_id: Optional branch ID
        created_by: User ID who created the invite
        expires_in_hours: Hours until expiry (default 24)
        
    Returns:
        Invite object
    """
    # Generate unique code
    code = generate_invite_code()
    
    # Ensure code is unique
    while True:
        existing = session.exec(select(Invite).where(Invite.code == code)).first()
        if not existing:
            break
        code = generate_invite_code()
    
    expires_at = datetime.utcnow() + timedelta(hours=expires_in_hours)
    
    invite = Invite(
        business_id=business_id,
        code=code,
        role=role,
        branch_id=branch_id,
        created_by=created_by,
        expires_at=expires_at,
        is_active=True,
    )
    session.add(invite)
    session.commit()
    session.refresh(invite)
    
    return invite


def validate_invite(session: Session, code: str) -> Optional[Invite]:
    """
    Validate an invite code
    
    Returns:
        Invite object if valid, None otherwise
    """
    invite = session.exec(select(Invite).where(Invite.code == code)).first()
    
    if not invite:
        return None
    
    if not invite.is_active:
        return None
    
    if invite.used_by is not None:
        return None  # Already used
    
    if invite.expires_at < datetime.utcnow():
        return None  # Expired
    
    return invite


def use_invite(
    session: Session,
    code: str,
    telegram_id: int,
    user_data: dict
) -> Optional[User]:
    """
    Use an invite code to join a business
    
    Args:
        session: Database session
        code: Invite code
        telegram_id: Telegram user ID
        user_data: User data (first_name, last_name, etc.)
        
    Returns:
        User object if successful, None otherwise
    """
    invite = validate_invite(session, code)
    if not invite:
        return None
    
    # Check if user already exists
    existing_user = session.exec(select(User).where(User.telegram_id == telegram_id)).first()
    
    if existing_user:
        # Update existing user
        existing_user.business_id = invite.business_id
        existing_user.branch_id = invite.branch_id
        existing_user.role = invite.role
        existing_user.first_name = user_data.get("first_name") or existing_user.first_name
        existing_user.last_name = user_data.get("last_name") or existing_user.last_name
        existing_user.username = user_data.get("username") or existing_user.username
        existing_user.photo_url = user_data.get("photo_url") or existing_user.photo_url
        session.add(existing_user)
        session.commit()
        session.refresh(existing_user)
        
        # Mark invite as used
        invite.used_by = existing_user.id
        invite.used_at = datetime.utcnow()
        invite.is_active = False
        session.add(invite)
        session.commit()
        
        return existing_user
    
    # Create new user
    user = User(
        telegram_id=telegram_id,
        business_id=invite.business_id,
        branch_id=invite.branch_id,
        role=invite.role,
        first_name=user_data.get("first_name"),
        last_name=user_data.get("last_name"),
        username=user_data.get("username"),
        photo_url=user_data.get("photo_url"),
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    
    # Mark invite as used
    invite.used_by = user.id
    invite.used_at = datetime.utcnow()
    invite.is_active = False
    session.add(invite)
    session.commit()
    
    return user


def get_business_invites(session: Session, business_id: int, active_only: bool = True) -> list[Invite]:
    """Get all invites for a business"""
    conditions = [Invite.business_id == business_id]
    if active_only:
        conditions.append(Invite.is_active == True)
        conditions.append(Invite.used_by.is_(None))
    
    statement = select(Invite).where(*conditions).order_by(Invite.created_at.desc())
    return list(session.exec(statement).all())


from sqlmodel import Session, select
from app.models.user import User
from app.core.security import create_access_token
from app.core.telegram import verify_telegram_auth
from app.schemas.auth import TelegramLoginRequest
from typing import Dict


def get_or_create_user(session: Session, telegram_data: Dict) -> User:
    """Get existing user or create new one from Telegram data"""
    telegram_id = telegram_data["id"]
    
    # Try to find existing user
    statement = select(User).where(User.telegram_id == telegram_id)
    user = session.exec(statement).first()
    
    if user:
        # Update user data
        user.first_name = telegram_data.get("first_name")
        user.last_name = telegram_data.get("last_name")
        user.username = telegram_data.get("username")
        user.photo_url = telegram_data.get("photo_url")
        session.add(user)
        session.commit()
        session.refresh(user)
        return user
    
    # Create new user
    user = User(
        telegram_id=telegram_id,
        first_name=telegram_data.get("first_name"),
        last_name=telegram_data.get("last_name"),
        username=telegram_data.get("username"),
        photo_url=telegram_data.get("photo_url"),
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


def authenticate_telegram_user(session: Session, login_data: TelegramLoginRequest) -> tuple[User, str]:
    """Authenticate user via Telegram and return user with access token"""
    # Convert to dict for verification
    telegram_data = login_data.model_dump()
    
    # Verify Telegram authentication
    if not verify_telegram_auth(telegram_data):
        raise ValueError("Invalid Telegram authentication data")
    
    # Get or create user
    user = get_or_create_user(session, telegram_data)
    
    # Create access token
    token_data = {"sub": str(user.id), "telegram_id": str(user.telegram_id)}
    access_token = create_access_token(token_data)
    
    return user, access_token


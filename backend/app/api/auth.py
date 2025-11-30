"""
Authentication API endpoints including PIN verification
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session
from pydantic import BaseModel
from app.api.dependencies import get_db, get_current_user
from app.models.user import User
from app.services.auth import get_or_create_user
from app.core.security import create_access_token
from app.core.config import settings
import bcrypt
from typing import Optional
from datetime import datetime

router = APIRouter(tags=["auth"])

# TODO: REMOVE THIS TEST USER BEFORE FINALIZING
# Test user for development/testing outside Telegram
TEST_USER = {
    "id": 684087296,
    "first_name": "Robel",
    "last_name": "Desta",
    "username": "robeldesta89",
}


class PinVerify(BaseModel):
    pin: str


@router.post("/verify-pin")
async def verify_pin(
    pin_data: PinVerify,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Verify PIN for staff access"""
    if not current_user.pin_hash:
        # No PIN set, allow access
        return {"valid": True}
    
    try:
        # Verify PIN
        is_valid = bcrypt.checkpw(
            pin_data.pin.encode('utf-8'),
            current_user.pin_hash.encode('utf-8')
        )
        return {"valid": is_valid}
    except Exception:
        return {"valid": False}


@router.post("/set-pin")
async def set_pin(
    pin_data: PinVerify,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Set or update PIN for user"""
    if len(pin_data.pin) != 4 or not pin_data.pin.isdigit():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="PIN must be 4 digits"
        )
    
    # Hash PIN
    pin_hash = bcrypt.hashpw(pin_data.pin.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    current_user.pin_hash = pin_hash
    db.add(current_user)
    db.commit()
    
    return {"success": True}


@router.post("/logout")
async def logout(
    current_user: User = Depends(get_current_user)
):
    """Logout endpoint - clears session on client side"""
    return {"success": True, "message": "Logged out successfully"}


# TODO: REMOVE THIS ENDPOINT BEFORE FINALIZING
# Dev/test login endpoint for testing outside Telegram
class DevLoginRequest(BaseModel):
    telegram_id: int
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    username: Optional[str] = None


@router.post("/dev-login")
async def dev_login(
    login_data: DevLoginRequest,
    db: Session = Depends(get_db)
):
    """
    Development login endpoint for testing outside Telegram.
    TODO: REMOVE THIS BEFORE FINALIZING - Only for development/testing
    """
    # Only allow in development or if explicitly enabled
    if not settings.DEBUG and not getattr(settings, 'ALLOW_DEV_LOGIN', False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Dev login not allowed in production"
        )
    
    # Use test user data
    telegram_data = {
        "id": login_data.telegram_id,
        "first_name": login_data.first_name,
        "last_name": login_data.last_name,
        "username": login_data.username,
    }
    
    # Get or create user
    user = get_or_create_user(db, telegram_data)
    
    # Create access token
    token_data = {"sub": str(user.id), "telegram_id": str(user.telegram_id)}
    access_token = create_access_token(token_data)
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "telegram_id": user.telegram_id,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "username": user.username,
            "photo_url": user.photo_url,
        }
    }

"""
API dependencies for authentication and authorization
"""
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlmodel import Session
from typing import Optional
from app.db.session import get_session
from app.models.user import User
from app.core.telegram import verify_telegram_auth
from app.core.config import settings
import os

security = HTTPBearer(auto_error=False)


def get_db() -> Session:
    """Get database session"""
    session = next(get_session())
    try:
        yield session
    finally:
        session.close()


def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """
    Get current authenticated user from Telegram initData or JWT token
    
    This verifies the Telegram authentication token and returns the user
    """
    # TODO: REMOVE TEST USER SUPPORT BEFORE FINALIZING
    # In development, allow bypassing auth if no credentials provided
    if not credentials and settings.DEBUG:
        # Try to get test user from database
        from sqlmodel import select
        test_user = db.exec(select(User).where(User.telegram_id == 684087296)).first()
        if test_user:
            return test_user
    
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required"
        )
    
    init_data = credentials.credentials
    
    # Check if it's a JWT token (starts with eyJ)
    if init_data.startswith("eyJ"):
        # It's a JWT token from dev-login
        from app.core.security import verify_token
        try:
            payload = verify_token(init_data)
            if payload:
                telegram_id = int(payload.get("telegram_id"))
                from sqlmodel import select
                user = db.exec(select(User).where(User.telegram_id == telegram_id)).first()
                if user:
                    from datetime import datetime
                    user.last_login_at = datetime.utcnow()
                    db.add(user)
                    db.commit()
                    return user
        except Exception:
            pass
    
    # Verify Telegram authentication
    # Parse init_data if it's a query string
    try:
        from urllib.parse import parse_qs
        parsed_data = {}
        for key, value in parse_qs(init_data).items():
            parsed_data[key] = value[0] if value else ""
        telegram_user = verify_telegram_auth(parsed_data)
    except:
        # Try as dict/JSON
        try:
            import json
            telegram_user = verify_telegram_auth(json.loads(init_data))
        except:
            telegram_user = None
    
    if not telegram_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication"
        )
    
    # Get or create user
    from sqlmodel import select
    user = db.exec(select(User).where(User.telegram_id == telegram_user["id"])).first()
    
    if not user:
        # Create new user
        user = User(
            telegram_id=telegram_user["id"],
            first_name=telegram_user.get("first_name"),
            last_name=telegram_user.get("last_name"),
            username=telegram_user.get("username"),
            photo_url=telegram_user.get("photo_url"),
            role="owner"  # First user is owner
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        # Update last login
        from datetime import datetime
        user.last_login_at = datetime.utcnow()
        db.add(user)
        db.commit()
    
    return user


def require_permission(permission: str):
    """
    Dependency factory for requiring specific permissions
    
    Usage:
        @router.get("/endpoint")
        async def endpoint(user: User = Depends(require_permission("view_reports"))):
            ...
    """
    def permission_checker(current_user: User = Depends(get_current_user)) -> User:
        from app.services.permissions import has_permission
        if not has_permission(current_user, permission):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"You don't have permission to {permission}"
            )
        return current_user
    
    return permission_checker


def require_role(role: str):
    """
    Dependency factory for requiring specific role
    
    Usage:
        @router.get("/endpoint")
        async def endpoint(user: User = Depends(require_role("owner"))):
            ...
    """
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role != role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"This endpoint requires {role} role"
            )
        return current_user
    
    return role_checker

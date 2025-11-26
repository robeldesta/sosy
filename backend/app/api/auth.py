from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session
from app.api.dependencies import get_db
from app.services.auth import authenticate_telegram_user
from app.schemas.auth import TelegramLoginRequest, LoginResponse, UserResponse

router = APIRouter()


@router.post("/telegram-login", response_model=LoginResponse)
async def telegram_login(
    login_data: TelegramLoginRequest,
    db: Session = Depends(get_db)
):
    """Authenticate user via Telegram login widget"""
    try:
        user, access_token = authenticate_telegram_user(db, login_data)
        return LoginResponse(
            access_token=access_token,
            token_type="bearer",
            user=UserResponse(
                id=user.id,
                telegram_id=user.telegram_id,
                first_name=user.first_name,
                last_name=user.last_name,
                username=user.username,
                photo_url=user.photo_url,
            )
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


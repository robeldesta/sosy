"""
Admin API endpoints for system statistics
"""
from fastapi import APIRouter, Depends
from sqlmodel import Session
from app.api.dependencies import get_db, get_current_user
from app.models.user import User
from app.services.admin_service import get_system_stats

router = APIRouter(prefix="/admin/stats", tags=["admin"])


def require_admin(current_user: User = Depends(get_current_user)) -> User:
    """Require admin role"""
    # TODO: Implement admin role check
    if not current_user.role or current_user.role != "owner":
        from fastapi import HTTPException
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user


@router.get("/dashboard")
async def get_dashboard_stats(
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Get admin dashboard statistics"""
    stats = get_system_stats(db)
    return stats


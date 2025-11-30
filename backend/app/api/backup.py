"""
Backup API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import FileResponse
from sqlmodel import Session
from app.api.dependencies import get_db, get_current_user
from app.models.user import User
from app.services.business import get_business_by_user_id
from app.services.backup import create_backup, get_latest_backup, cleanup_old_backups
import os

router = APIRouter(prefix="/backup", tags=["backup"])


@router.post("")
async def create_backup_endpoint(
    format: str = Query("json", regex="^(json|csv)$"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create backup for current user's business"""
    business = get_business_by_user_id(db, current_user.id)
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")
    
    try:
        backup_path = create_backup(db, business.id, format)
        return {
            "message": "Backup created successfully",
            "path": backup_path,
            "format": format
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create backup: {str(e)}")


@router.get("/download-latest")
async def download_latest_backup(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Download latest backup file"""
    business = get_business_by_user_id(db, current_user.id)
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")
    
    backup_path = get_latest_backup(business.id)
    if not backup_path or not os.path.exists(backup_path):
        raise HTTPException(status_code=404, detail="No backup found")
    
    return FileResponse(
        backup_path,
        media_type="application/json",
        filename=os.path.basename(backup_path)
    )


@router.post("/cleanup")
async def cleanup_backups(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Cleanup old backups (admin only - add proper auth check)"""
    try:
        cleanup_old_backups()
        return {"message": "Old backups cleaned up successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to cleanup backups: {str(e)}")


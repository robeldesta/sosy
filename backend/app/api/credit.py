"""
Credit aging report API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session
from app.api.dependencies import get_db, get_current_user
from app.models.user import User
from app.services.business import get_business_by_user_id
from app.services.aging_service import get_aging_report
from app.schemas.customer import AgingReportResponse

router = APIRouter(prefix="/credit", tags=["credit"])


@router.get("/aging", response_model=AgingReportResponse)
async def get_aging_report_endpoint(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get credit aging report"""
    business = get_business_by_user_id(db, current_user.id)
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")
    
    report = get_aging_report(db, business.id, current_user.branch_id)
    return report

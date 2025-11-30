"""
Stock Take API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, Path
from sqlmodel import Session, select
from typing import List
from app.api.dependencies import get_db, get_current_user
from app.models.user import User
from app.models.business import Business
from app.models.stock_take import StockTakeSession, StockTakeLine
from app.models.product import Product
from app.services.business import get_business_by_user_id
from app.services.stock_take_service import (
    create_stock_take_session,
    add_stock_take_counts,
    approve_stock_take,
    get_stock_take_summary,
    get_shrinkage_report
)
from app.schemas.stock_take import (
    StockTakeSessionCreate,
    StockTakeCountRequest,
    StockTakeSessionResponse,
    StockTakeSummary,
    ShrinkageReport
)
from app.api.middleware.subscription import require_active_subscription

router = APIRouter(prefix="/stocktake", tags=["stocktake"])


@router.post("/start", response_model=StockTakeSessionResponse)
async def start_stock_take(
    data: StockTakeSessionCreate,
    current_user: User = Depends(require_active_subscription),
    db: Session = Depends(get_db)
):
    """Start a new stock take session"""
    business = get_business_by_user_id(db, current_user.id)
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")
    
    session = create_stock_take_session(
        session=db,
        user_id=current_user.id,
        business_id=business.id,
        branch_id=data.branch_id,
        notes=data.notes
    )
    
    # Get lines (empty initially)
    return {
        "id": session.id,
        "started_at": session.started_at,
        "completed_at": session.completed_at,
        "status": session.status,
        "notes": session.notes,
        "total_items_counted": session.total_items_counted,
        "total_differences": session.total_differences,
        "total_loss_value": session.total_loss_value,
        "total_gain_value": session.total_gain_value,
        "lines": []
    }


@router.post("/session/{session_id}/count")
async def add_counts(
    session_id: int = Path(...),
    count_data: StockTakeCountRequest = ...,
    current_user: User = Depends(require_active_subscription),
    db: Session = Depends(get_db)
):
    """Add counts to a stock take session"""
    business = get_business_by_user_id(db, current_user.id)
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")
    
    # Verify session belongs to business
    session_obj = db.get(StockTakeSession, session_id)
    if not session_obj or session_obj.business_id != business.id:
        raise HTTPException(status_code=404, detail="Stock take session not found")
    
    try:
        counts = [
            {
                "product_id": line.product_id,
                "counted_qty": line.counted_qty,
                "notes": line.notes
            }
            for line in count_data.lines
        ]
        
        updated_session = add_stock_take_counts(
            session=db,
            session_id=session_id,
            user_id=current_user.id,
            counts=counts
        )
        
        return {
            "success": True,
            "session_id": updated_session.id,
            "total_items_counted": updated_session.total_items_counted,
            "total_differences": updated_session.total_differences
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/session/{session_id}/review")
async def mark_for_review(
    session_id: int = Path(...),
    current_user: User = Depends(require_active_subscription),
    db: Session = Depends(get_db)
):
    """Mark stock take session as ready for review"""
    business = get_business_by_user_id(db, current_user.id)
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")
    
    session_obj = db.get(StockTakeSession, session_id)
    if not session_obj or session_obj.business_id != business.id:
        raise HTTPException(status_code=404, detail="Stock take session not found")
    
    if session_obj.status != "open":
        raise HTTPException(status_code=400, detail="Session is not open")
    
    session_obj.status = "review"
    db.add(session_obj)
    db.commit()
    db.refresh(session_obj)
    
    return {"success": True, "status": session_obj.status}


@router.post("/session/{session_id}/approve")
async def approve_session(
    session_id: int = Path(...),
    notes: str = None,
    current_user: User = Depends(require_active_subscription),
    db: Session = Depends(get_db)
):
    """Approve stock take and apply adjustments"""
    business = get_business_by_user_id(db, current_user.id)
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")
    
    try:
        approved_session = approve_stock_take(
            session=db,
            session_id=session_id,
            user_id=current_user.id,
            notes=notes
        )
        
        return {
            "success": True,
            "session_id": approved_session.id,
            "status": approved_session.status,
            "completed_at": approved_session.completed_at
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/session/{session_id}", response_model=StockTakeSessionResponse)
async def get_session(
    session_id: int = Path(...),
    current_user: User = Depends(require_active_subscription),
    db: Session = Depends(get_db)
):
    """Get stock take session with all lines"""
    business = get_business_by_user_id(db, current_user.id)
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")
    
    session_obj = db.get(StockTakeSession, session_id)
    if not session_obj or session_obj.business_id != business.id:
        raise HTTPException(status_code=404, detail="Stock take session not found")
    
    # Get lines
    lines_statement = select(StockTakeLine).where(
        StockTakeLine.session_id == session_id
    )
    lines = db.exec(lines_statement).all()
    
    # Format lines with product names
    formatted_lines = []
    for line in lines:
        product = db.get(Product, line.product_id)
        formatted_lines.append({
            "id": line.id,
            "product_id": line.product_id,
            "product_name": product.name if product else "Unknown",
            "expected_qty": line.expected_qty,
            "counted_qty": line.counted_qty,
            "difference": line.difference,
            "difference_type": line.difference_type,
            "difference_value": line.difference_value,
            "counted_at": line.counted_at,
            "notes": line.notes
        })
    
    return {
        "id": session_obj.id,
        "started_at": session_obj.started_at,
        "completed_at": session_obj.completed_at,
        "status": session_obj.status,
        "notes": session_obj.notes,
        "total_items_counted": session_obj.total_items_counted,
        "total_differences": session_obj.total_differences,
        "total_loss_value": session_obj.total_loss_value,
        "total_gain_value": session_obj.total_gain_value,
        "lines": formatted_lines
    }


@router.get("/session/{session_id}/summary", response_model=StockTakeSummary)
async def get_summary(
    session_id: int = Path(...),
    current_user: User = Depends(require_active_subscription),
    db: Session = Depends(get_db)
):
    """Get summary statistics for stock take session"""
    business = get_business_by_user_id(db, current_user.id)
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")
    
    try:
        summary = get_stock_take_summary(db, session_id)
        return summary
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/session/{session_id}/report", response_model=ShrinkageReport)
async def get_shrinkage_report_endpoint(
    session_id: int = Path(...),
    current_user: User = Depends(require_active_subscription),
    db: Session = Depends(get_db)
):
    """Get shrinkage report for stock take session"""
    business = get_business_by_user_id(db, current_user.id)
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")
    
    try:
        report = get_shrinkage_report(db, session_id)
        return report
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/sessions")
async def list_sessions(
    status: str = None,
    current_user: User = Depends(require_active_subscription),
    db: Session = Depends(get_db)
):
    """List stock take sessions for user's business"""
    business = get_business_by_user_id(db, current_user.id)
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")
    
    statement = select(StockTakeSession).where(
        StockTakeSession.business_id == business.id
    )
    
    if status:
        statement = statement.where(StockTakeSession.status == status)
    
    statement = statement.order_by(StockTakeSession.started_at.desc())
    sessions = db.exec(statement).all()
    
    return [
        {
            "id": s.id,
            "started_at": s.started_at,
            "completed_at": s.completed_at,
            "status": s.status,
            "total_items_counted": s.total_items_counted,
            "total_differences": s.total_differences,
            "total_loss_value": s.total_loss_value,
            "total_gain_value": s.total_gain_value,
        }
        for s in sessions
    ]


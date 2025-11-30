"""
Branch API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from typing import List, Optional
from app.api.dependencies import get_db, get_current_user
from app.models.user import User
from app.models.branch import Branch
from app.services.business import get_business_by_user_id
from app.services.permissions import can_manage_staff
from pydantic import BaseModel

router = APIRouter(prefix="/branch", tags=["branch"])


class BranchCreate(BaseModel):
    name: str
    location: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None


class BranchResponse(BaseModel):
    id: int
    business_id: int
    name: str
    location: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    is_active: bool
    created_at: str
    updated_at: str


@router.post("", response_model=BranchResponse, status_code=status.HTTP_201_CREATED)
async def create_branch_endpoint(
    branch_data: BranchCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new branch (owner only)"""
    if current_user.role != "owner":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only owners can create branches"
        )
    
    business = get_business_by_user_id(db, current_user.id)
    if not business:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Business not found"
        )
    
    branch = Branch(
        business_id=business.id,
        **branch_data.model_dump()
    )
    db.add(branch)
    db.commit()
    db.refresh(branch)
    
    return branch


@router.get("", response_model=List[BranchResponse])
async def list_branches_endpoint(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all branches for business"""
    business = get_business_by_user_id(db, current_user.id)
    if not business:
        return []
    
    statement = select(Branch).where(
        Branch.business_id == business.id,
        Branch.is_active == True
    ).order_by(Branch.name)
    
    branches = db.exec(statement).all()
    return branches


@router.put("/{branch_id}", response_model=BranchResponse)
async def update_branch_endpoint(
    branch_id: int,
    branch_data: BranchCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a branch (owner only)"""
    if current_user.role != "owner":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only owners can update branches"
        )
    
    business = get_business_by_user_id(db, current_user.id)
    if not business:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Business not found"
        )
    
    branch = db.get(Branch, branch_id)
    if not branch or branch.business_id != business.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Branch not found"
        )
    
    for key, value in branch_data.model_dump().items():
        setattr(branch, key, value)
    
    db.add(branch)
    db.commit()
    db.refresh(branch)
    
    return branch


@router.delete("/{branch_id}")
async def delete_branch_endpoint(
    branch_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a branch (owner only)"""
    if current_user.role != "owner":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only owners can delete branches"
        )
    
    business = get_business_by_user_id(db, current_user.id)
    if not business:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Business not found"
        )
    
    branch = db.get(Branch, branch_id)
    if not branch or branch.business_id != business.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Branch not found"
        )
    
    branch.is_active = False
    db.add(branch)
    db.commit()
    
    return {"success": True}


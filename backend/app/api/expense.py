"""
Expense API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from typing import List
from app.api.dependencies import get_db, get_current_user
from app.models.user import User
from app.models.expense import Expense, ExpenseCategory
from app.services.business import get_business_by_user_id
from app.services.cashbook_service import create_cashbook_entry
from app.services.activity_service import log_expense_added
from app.schemas.expense import (
    ExpenseCreate,
    ExpenseResponse,
    ExpenseCategoryCreate,
    ExpenseCategoryResponse,
)

router = APIRouter(prefix="/expense", tags=["expense"])


@router.get("/categories", response_model=List[ExpenseCategoryResponse])
async def get_expense_categories(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all expense categories for user's business"""
    business = get_business_by_user_id(db, current_user.id)
    if not business:
        return []
    
    statement = select(ExpenseCategory).where(ExpenseCategory.business_id == business.id)
    categories = db.exec(statement).all()
    return list(categories)


@router.post("/categories", response_model=ExpenseCategoryResponse, status_code=201)
async def create_expense_category(
    category_data: ExpenseCategoryCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new expense category"""
    business = get_business_by_user_id(db, current_user.id)
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")
    
    category = ExpenseCategory(
        business_id=business.id,
        name=category_data.name,
        description=category_data.description,
    )
    db.add(category)
    db.commit()
    db.refresh(category)
    return category


@router.post("", response_model=ExpenseResponse, status_code=201)
async def create_expense(
    expense_data: ExpenseCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new expense"""
    business = get_business_by_user_id(db, current_user.id)
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")
    
    # Validate category if provided
    if expense_data.category_id:
        category = db.get(ExpenseCategory, expense_data.category_id)
        if not category or category.business_id != business.id:
            raise HTTPException(status_code=404, detail="Expense category not found")
    
    expense = Expense(
        business_id=business.id,
        category_id=expense_data.category_id,
        amount=expense_data.amount,
        description=expense_data.description,
        expense_date=expense_data.expense_date,
        payment_method=expense_data.payment_method,
        receipt_photo_url=expense_data.receipt_photo_url,
        notes=expense_data.notes,
        created_by=current_user.id,
    )
    db.add(expense)
    db.commit()
    db.refresh(expense)
    
    # Log activity
    log_expense_added(
        session=db,
        business_id=business.id,
        expense_id=expense.id,
        amount=expense.amount,
        description=expense.description,
        user_id=current_user.id
    )
    
    # Create cashbook entry if cash payment
    if expense.payment_method == "cash":
        create_cashbook_entry(
            session=db,
            business_id=business.id,
            entry_type="expense_out",
            amount=expense.amount,
            description=expense.description,
            payment_method="cash",
            reference_id=expense.id,
            reference_type="expense",
            user_id=current_user.id
        )
    
    return expense


@router.get("", response_model=List[ExpenseResponse])
async def get_expenses(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all expenses for user's business"""
    business = get_business_by_user_id(db, current_user.id)
    if not business:
        return []
    
    statement = select(Expense).where(Expense.business_id == business.id).order_by(Expense.expense_date.desc())
    expenses = db.exec(statement).all()
    return list(expenses)


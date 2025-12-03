"""
POS API endpoints for fast checkout
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select
from typing import List, Optional
from app.api.dependencies import get_db, get_current_user
from app.models.user import User
from app.models.product import Product
from app.models.business import Business
from app.services.business import get_business_by_user_id
from app.services.pos_service import (
    checkout,
    get_active_pos_session,
    create_pos_session,
    close_pos_session,
    send_pos_notification
)
from app.schemas.pos import (
    CartUpdateRequest,
    CheckoutRequest,
    SaleResponse,
    POSSessionResponse
)
from app.api.middleware.subscription import require_active_subscription

router = APIRouter(prefix="/pos", tags=["pos"])


@router.get("/search")
async def search_products(
    q: str = Query(..., min_length=1, description="Search query"),
    limit: int = Query(20, ge=1, le=50),
    current_user: User = Depends(require_active_subscription),
    db: Session = Depends(get_db)
):
    """Fast product search for POS"""
    business = get_business_by_user_id(db, current_user.id)
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")
    
    # Search by name or SKU/barcode
    search_term = f"%{q.lower()}%"
    statement = (
        select(Product)
        .where(
            Product.business_id == business.id,
            (
                (Product.name.ilike(search_term)) |
                (Product.sku.ilike(search_term)) |
                (Product.barcode.ilike(search_term))
            )
        )
        .limit(limit)
    )
    
    products = db.exec(statement).all()
    
    return [
        {
            "id": p.id,
            "name": p.name,
            "price": p.sale_price or 0.0,
            "stock": p.current_stock,
            "sku": p.sku,
            "barcode": p.barcode,
            "unit": p.unit or "pcs"
        }
        for p in products
    ]


@router.post("/cart/validate")
async def validate_cart(
    cart_data: CartUpdateRequest,
    current_user: User = Depends(require_active_subscription),
    db: Session = Depends(get_db)
):
    """Validate cart items before checkout (check stock)"""
    business = get_business_by_user_id(db, current_user.id)
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")
    
    validated_items = []
    errors = []
    
    for item in cart_data.items:
        product = db.get(Product, item.product_id)
        if not product:
            errors.append(f"Product {item.product_id} not found")
            continue
        
        if product.business_id != business.id:
            errors.append(f"Product {item.product_id} does not belong to your business")
            continue
        
        if product.current_stock < item.quantity:
            errors.append(f"Insufficient stock for {product.name}. Available: {product.current_stock}")
            continue
        
        validated_items.append({
            "product_id": product.id,
            "product_name": product.name,
            "quantity": item.quantity,
            "unit_price": item.unit_price,
            "subtotal": item.quantity * item.unit_price,
            "stock_available": product.current_stock
        })
    
    return {
        "valid": len(errors) == 0,
        "items": validated_items,
        "errors": errors
    }


@router.post("/checkout")
async def pos_checkout(
    checkout_data: CheckoutRequest,
    current_user: User = Depends(require_active_subscription),
    db: Session = Depends(get_db)
):
    """Process POS checkout with atomic stock deduction"""
    business = get_business_by_user_id(db, current_user.id)
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")
    
    # Convert items to dict format
    items = [
        {
            "product_id": item.product_id,
            "quantity": item.quantity,
            "unit_price": item.unit_price
        }
        for item in checkout_data.items
    ]
    
    try:
        # Validate credit payment requires customer_id
        if checkout_data.payment_method == "credit" and not checkout_data.customer_id:
            raise HTTPException(
                status_code=400,
                detail="customer_id is required for credit payments"
            )
        
        # Process checkout (atomic stock deduction)
        sale = checkout(
            session=db,
            user_id=current_user.id,
            business_id=business.id,
            items=items,
            payment_method=checkout_data.payment_method,
            customer_name=checkout_data.customer_name,
            customer_phone=checkout_data.customer_phone,
            customer_id=checkout_data.customer_id,
            discount=checkout_data.discount,
            notes=checkout_data.notes
        )
        
        # Get invoice ID (created during checkout)
        from app.models.invoice import Invoice
        invoice_statement = select(Invoice).where(
            Invoice.business_id == business.id
        ).order_by(Invoice.id.desc()).limit(1)
        invoice = db.exec(invoice_statement).first()
        
        # Send notification (async, don't wait)
        if invoice:
            # In production, use background task
            # await send_pos_notification(db, sale, invoice.id, current_user.telegram_id)
            pass
        
        # Return sale with items
        db.refresh(sale)
        return {
            "success": True,
            "sale_id": sale.id,
            "invoice_id": invoice.id if invoice else None,
            "invoice_number": invoice.invoice_number if invoice else None,
            "total": sale.total,
            "payment_method": sale.payment_method
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Checkout failed: {str(e)}")


@router.get("/session")
async def get_pos_session(
    current_user: User = Depends(require_active_subscription),
    db: Session = Depends(get_db)
):
    """Get active POS session"""
    business = get_business_by_user_id(db, current_user.id)
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")
    
    pos_session = get_active_pos_session(db, current_user.id, business.id)
    if not pos_session:
        # Create new session
        pos_session = create_pos_session(db, current_user.id, business.id)
    
    return {
        "id": pos_session.id,
        "opened_at": pos_session.opened_at,
        "total_sales": pos_session.total_sales,
        "total_transactions": pos_session.total_transactions,
        "cash_total": pos_session.cash_total,
        "mobile_money_total": pos_session.mobile_money_total,
        "card_total": pos_session.card_total,
        "credit_total": pos_session.credit_total,
        "is_active": pos_session.is_active
    }


@router.post("/session/close")
async def close_session(
    current_user: User = Depends(require_active_subscription),
    db: Session = Depends(get_db)
):
    """Close active POS session"""
    business = get_business_by_user_id(db, current_user.id)
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")
    
    pos_session = get_active_pos_session(db, current_user.id, business.id)
    if not pos_session:
        raise HTTPException(status_code=404, detail="No active POS session")
    
    closed_session = close_pos_session(db, pos_session.id)
    
    return {
        "success": True,
        "session_id": closed_session.id,
        "total_sales": closed_session.total_sales,
        "total_transactions": closed_session.total_transactions
    }


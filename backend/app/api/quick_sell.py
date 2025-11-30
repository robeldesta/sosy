from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session
from app.api.dependencies import get_db, get_current_user
from app.models.user import User
from app.services.business import get_business_by_user_id
from app.services.quick_sell_service import quick_sell
from app.schemas.dashboard import QuickSellRequest
from app.schemas.invoice import InvoiceResponse
from app.models.invoice import InvoiceItem
from sqlmodel import select

router = APIRouter(prefix="/quick_sell", tags=["quick_sell"])


@router.post("", response_model=InvoiceResponse)
async def quick_sell_endpoint(
    request: QuickSellRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Quick sell: Create an invoice with one product"""
    business = get_business_by_user_id(db, current_user.id)
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")
    
    try:
        invoice = quick_sell(
            db,
            business.id,
            request.product_id,
            request.quantity,
            request.customer_name,
            current_user.id
        )
        
        # Load invoice items for response
        statement = select(InvoiceItem).where(InvoiceItem.invoice_id == invoice.id)
        items = db.exec(statement).all()
        
        return InvoiceResponse(
            id=invoice.id,
            business_id=invoice.business_id,
            invoice_number=invoice.invoice_number,
            customer_name=invoice.customer_name,
            customer_phone=invoice.customer_phone,
            items=[{
                "id": item.id,
                "invoice_id": item.invoice_id,
                "stock_item_id": item.stock_item_id,
                "quantity": item.quantity,
                "unit_price": item.unit_price,
                "total": item.total,
            } for item in items],
            subtotal=invoice.subtotal,
            tax=invoice.tax,
            total=invoice.total,
            status=invoice.status,
            created_at=invoice.created_at,
            updated_at=invoice.updated_at,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing quick sell: {str(e)}")


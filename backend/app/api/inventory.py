from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlmodel import Session
from typing import List, Optional
from datetime import datetime
from app.api.dependencies import get_db, get_current_user
from app.models.user import User
from app.services.business import get_business_by_user_id
from app.services.permissions import can_view_cost_prices, filter_sensitive_data
from app.services.inventory_service import (
    add_product,
    record_movement,
    calculate_stock,
    list_stock,
    get_product_movements,
)
from app.schemas.product import ProductCreate, ProductResponse, ProductUpdate
from app.schemas.inventory_stock import StockItemResponse, StockItemWithProduct, StockAdjustmentRequest
from app.schemas.inventory_movement import InventoryMovementCreate, InventoryMovementResponse, InventoryMovementWithProduct
from app.models.product import Product
from app.models.inventory_stock import StockItem
from app.models.inventory_movement import InventoryMovement

router = APIRouter()


@router.get("/products", response_model=List[ProductResponse])
async def get_products(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all products for user's business"""
    business = get_business_by_user_id(db, current_user.id)
    if not business:
        return []
    
    from sqlmodel import select
    statement = select(Product).where(Product.business_id == business.id)
    products = db.exec(statement).all()
    
    # Filter sensitive data based on permissions
    show_sensitive = business.show_sensitive_data if business else False
    
    result = []
    for product in products:
        product_dict = product.model_dump()
        if not can_view_cost_prices(current_user):
            product_dict = filter_sensitive_data(product_dict, current_user, show_sensitive)
        result.append(product_dict)
    
    return result


@router.post("/products", response_model=ProductResponse)
async def create_product(
    product_data: ProductCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new product (requires active subscription)"""
    from app.api.middleware.subscription import require_active_subscription
    require_active_subscription(current_user, db)
    
    business = get_business_by_user_id(db, current_user.id)
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")
    
    # Check product limit
    from app.services.subscription_service import check_subscription_limit
    has_limit, max_products = check_subscription_limit(db, current_user.id, "products")
    if has_limit and max_products is not None:
        # Count existing products
        from sqlmodel import select, func
        count_statement = select(func.count(Product.id)).where(Product.business_id == business.id)
        current_count = db.exec(count_statement).first() or 0
        if current_count >= max_products:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Product limit reached ({max_products}). Please upgrade your plan."
            )
    
    try:
        product = add_product(db, business.id, product_data, current_user.id)
        return product
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/stock", response_model=List[StockItemWithProduct])
async def get_stock(
    location: Optional[str] = Query(None, description="Filter by location"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all stock items for user's business"""
    try:
        business = get_business_by_user_id(db, current_user.id)
        if not business:
            return []
        
        stock_items = list_stock(db, business.id, location)
        
        # Enrich with product information
        result = []
        for item in stock_items:
            product = db.get(Product, item.product_id)
            if product:
                result.append(StockItemWithProduct(
                    id=item.id,
                    product_id=item.product_id,
                    quantity=item.quantity,
                    location=item.location,
                    last_updated=item.last_updated,
                    product_name=product.name,
                    product_sku=product.sku,
                    unit_of_measure=product.unit_of_measure,
                ))
        
        return result
    except Exception as e:
        import traceback
        print(f"Error in get_stock: {e}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/stock/movement", response_model=InventoryMovementResponse)
async def create_movement(
    movement_data: InventoryMovementCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Record an inventory movement"""
    business = get_business_by_user_id(db, current_user.id)
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")
    
    # Verify product belongs to business
    product = db.get(Product, movement_data.product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    if product.business_id != business.id:
        raise HTTPException(status_code=403, detail="Product does not belong to your business")
    
    try:
        movement = record_movement(db, movement_data.product_id, movement_data, current_user.id)
        return movement
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/products/{product_id}", response_model=ProductResponse)
async def get_product(
    product_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific product"""
    business = get_business_by_user_id(db, current_user.id)
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")
    
    product = db.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    if product.business_id != business.id:
        raise HTTPException(status_code=403, detail="Product does not belong to your business")
    
    # Filter sensitive data based on permissions
    show_sensitive = business.show_sensitive_data if business else False
    
    product_dict = product.model_dump()
    if not can_view_cost_prices(current_user):
        product_dict = filter_sensitive_data(product_dict, current_user, show_sensitive)
    
    return product_dict


@router.put("/products/{product_id}", response_model=ProductResponse)
async def update_product(
    product_id: int,
    product_data: ProductUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a product"""
    business = get_business_by_user_id(db, current_user.id)
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")
    
    product = db.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    if product.business_id != business.id:
        raise HTTPException(status_code=403, detail="Product does not belong to your business")
    
    # Track price changes for activity logging
    old_price = product.selling_price
    old_buying_price = product.buying_price
    
    # Update fields
    update_data = product_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(product, field, value)
    
    product.updated_at = datetime.utcnow()
    db.add(product)
    db.commit()
    db.refresh(product)
    
    # Log price changes
    from app.services.activity_service import log_item_price_changed
    if "selling_price" in update_data and update_data["selling_price"] != old_price:
        log_item_price_changed(
            session=db,
            business_id=business.id,
            item_id=product.id,
            item_name=product.name,
            old_price=old_price,
            new_price=product.selling_price,
            user_id=current_user.id
        )
    
    # Filter sensitive data before returning
    show_sensitive = business.show_sensitive_data if business else False
    product_dict = product.model_dump()
    if not can_view_cost_prices(current_user):
        product_dict = filter_sensitive_data(product_dict, current_user, show_sensitive)
    
    return product_dict


@router.delete("/products/{product_id}", status_code=204)
async def delete_product(
    product_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a product (soft delete by setting is_active=False)"""
    from datetime import datetime
    
    business = get_business_by_user_id(db, current_user.id)
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")
    
    product = db.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    if product.business_id != business.id:
        raise HTTPException(status_code=403, detail="Product does not belong to your business")
    
    # Soft delete
    product.is_active = False
    product.updated_at = datetime.utcnow()
    db.add(product)
    db.commit()
    
    return None


@router.post("/stock/{stock_item_id}/adjust", response_model=StockItemResponse)
async def adjust_stock(
    stock_item_id: int,
    adjustment_data: StockAdjustmentRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Adjust stock quantity (increase or decrease)"""
    business = get_business_by_user_id(db, current_user.id)
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")
    
    stock_item = db.get(StockItem, stock_item_id)
    if not stock_item:
        raise HTTPException(status_code=404, detail="Stock item not found")
    
    # Verify product belongs to business
    product = db.get(Product, stock_item.product_id)
    if not product or product.business_id != business.id:
        raise HTTPException(status_code=403, detail="Stock item does not belong to your business")
    
    # Record movement
    movement_type = "adjustment_up" if adjustment_data.adjustment > 0 else "adjustment_down"
    movement_data = InventoryMovementCreate(
        movement_type=movement_type,
        quantity=abs(adjustment_data.adjustment),
        reference=adjustment_data.reference or f"Manual adjustment by user {current_user.id}",
    )
    
    record_movement(db, stock_item.product_id, movement_data, current_user.id)
    
    # Refresh stock item
    db.refresh(stock_item)
    
    return StockItemResponse(
        id=stock_item.id,
        product_id=stock_item.product_id,
        quantity=stock_item.quantity,
        location=stock_item.location,
        last_updated=stock_item.last_updated,
    )


@router.get("/products/{product_id}/movements", response_model=List[InventoryMovementWithProduct])
async def get_product_movements_endpoint(
    product_id: int,
    limit: Optional[int] = Query(None, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all movements for a specific product"""
    business = get_business_by_user_id(db, current_user.id)
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")
    
    # Verify product belongs to business
    product = db.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    if product.business_id != business.id:
        raise HTTPException(status_code=403, detail="Product does not belong to your business")
    
    movements = get_product_movements(db, product_id, limit)
    
    # Enrich with product information
    result = []
    for movement in movements:
        result.append(InventoryMovementWithProduct(
            id=movement.id,
            product_id=movement.product_id,
            movement_type=movement.movement_type,
            quantity=movement.quantity,
            reference=movement.reference,
            created_at=movement.created_at,
            user_id=movement.user_id,
            product_name=product.name,
            product_sku=product.sku,
        ))
    
    return result



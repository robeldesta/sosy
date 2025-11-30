"""
Sync service for offline-first multi-device synchronization
"""
from sqlmodel import Session, select, func
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime, timedelta
from app.models.sync import SyncState, SyncAction
from app.models.product import Product
from app.models.pos import Sale
from app.models.invoice import Invoice
from app.models.inventory_movement import InventoryMovement
from app.services.pos_service import checkout as pos_checkout


def get_or_create_sync_state(session: Session, user_id: int, device_id: Optional[str] = None) -> SyncState:
    """Get or create sync state for user/device"""
    statement = select(SyncState).where(SyncState.user_id == user_id)
    if device_id:
        statement = statement.where(SyncState.device_id == device_id)
    
    sync_state = session.exec(statement).first()
    
    if not sync_state:
        sync_state = SyncState(
            user_id=user_id,
            device_id=device_id
        )
        session.add(sync_state)
        session.commit()
        session.refresh(sync_state)
    
    return sync_state


def update_sync_state(session: Session, user_id: int, device_id: Optional[str] = None) -> SyncState:
    """Update sync state timestamp"""
    sync_state = get_or_create_sync_state(session, user_id, device_id)
    sync_state.last_sync_at = datetime.utcnow()
    sync_state.updated_at = datetime.utcnow()
    session.add(sync_state)
    session.commit()
    session.refresh(sync_state)
    return sync_state


def process_sync_actions(
    session: Session,
    user_id: int,
    business_id: int,
    actions: List[Dict[str, Any]]
) -> Tuple[List[str], List[str], Dict[str, str]]:
    """
    Process sync actions from client
    
    Returns: (processed_ids, failed_ids, errors)
    """
    processed_ids = []
    failed_ids = []
    errors = {}
    
    for action_data in actions:
        action_id = action_data['id']
        action_type = action_data['type']
        payload = action_data['payload']
        
        try:
            # Check if already processed (idempotency)
            existing = session.exec(
                select(SyncAction).where(SyncAction.action_id == action_id)
            ).first()
            
            if existing and existing.status == "processed":
                processed_ids.append(action_id)
                continue
            
            # Create sync action record
            sync_action = SyncAction(
                user_id=user_id,
                action_id=action_id,
                action_type=action_type,
                payload=payload,
                status="pending"
            )
            session.add(sync_action)
            session.commit()
            
            # Process based on type
            if action_type == "sale":
                # Process POS sale
                result = pos_checkout(
                    session=session,
                    user_id=user_id,
                    business_id=business_id,
                    items=payload.get('items', []),
                    payment_method=payload.get('payment_method', 'cash'),
                    customer_name=payload.get('customer_name'),
                    customer_phone=payload.get('customer_phone'),
                    discount=payload.get('discount', 0.0),
                    notes=payload.get('notes')
                )
                sync_action.status = "processed"
                sync_action.processed_at = datetime.utcnow()
                
            elif action_type == "stock_update":
                # Update stock level (last-write-wins)
                product_id = payload.get('product_id')
                new_stock = payload.get('stock')
                
                product = session.get(Product, product_id)
                if product and product.business_id == business_id:
                    product.current_stock = new_stock
                    product.updated_at = datetime.utcnow()
                    session.add(product)
                    sync_action.status = "processed"
                    sync_action.processed_at = datetime.utcnow()
                else:
                    raise ValueError(f"Product {product_id} not found")
                    
            elif action_type == "product_update":
                # Update product (last-write-wins)
                product_id = payload.get('product_id')
                updates = payload.get('updates', {})
                
                product = session.get(Product, product_id)
                if product and product.business_id == business_id:
                    # Apply updates
                    for key, value in updates.items():
                        if hasattr(product, key) and key not in ['id', 'business_id', 'created_at']:
                            setattr(product, key, value)
                    product.updated_at = datetime.utcnow()
                    session.add(product)
                    sync_action.status = "processed"
                    sync_action.processed_at = datetime.utcnow()
                else:
                    raise ValueError(f"Product {product_id} not found")
            
            else:
                raise ValueError(f"Unknown action type: {action_type}")
            
            session.add(sync_action)
            session.commit()
            processed_ids.append(action_id)
            
        except Exception as e:
            session.rollback()
            failed_ids.append(action_id)
            errors[action_id] = str(e)
            
            # Mark action as failed
            try:
                sync_action = SyncAction(
                    user_id=user_id,
                    action_id=action_id,
                    action_type=action_type,
                    payload=payload,
                    status="failed",
                    error_message=str(e)
                )
                session.add(sync_action)
                session.commit()
            except:
                pass
    
    return processed_ids, failed_ids, errors


def get_sync_changes(
    session: Session,
    user_id: int,
    business_id: int,
    since: Optional[datetime] = None
) -> List[Dict[str, Any]]:
    """
    Get changes since last sync (delta sync)
    
    Returns changes for:
    - Products (created/updated)
    - Stock levels (updated)
    - Sales (created)
    - Invoices (created)
    """
    changes = []
    
    if not since:
        # First sync - return last 24 hours
        since = datetime.utcnow() - timedelta(hours=24)
    
    # Product changes
    product_statement = select(Product).where(
        Product.business_id == business_id,
        Product.updated_at >= since
    )
    products = session.exec(product_statement).all()
    
    for product in products:
        changes.append({
            "type": "product",
            "entity_id": product.id,
            "data": {
                "id": product.id,
                "name": product.name,
                "sale_price": product.sale_price,
                "current_stock": product.current_stock,
                "sku": product.sku,
                "barcode": product.barcode,
                "unit": product.unit,
                "min_stock": product.min_stock,
            },
            "updated_at": product.updated_at,
            "action": "updated" if product.created_at < since else "created"
        })
    
    # Stock changes (from inventory movements)
    movement_statement = select(InventoryMovement).where(
        InventoryMovement.business_id == business_id,
        InventoryMovement.created_at >= since
    )
    movements = session.exec(movement_statement).all()
    
    # Group by product and get latest stock
    product_stocks = {}
    for movement in movements:
        if movement.product_id not in product_stocks:
            product_stocks[movement.product_id] = {
                "product_id": movement.product_id,
                "updated_at": movement.created_at
            }
        else:
            if movement.created_at > product_stocks[movement.product_id]["updated_at"]:
                product_stocks[movement.product_id]["updated_at"] = movement.created_at
    
    # Get current stock for changed products
    for product_id, stock_info in product_stocks.items():
        product = session.get(Product, product_id)
        if product:
            changes.append({
                "type": "stock",
                "entity_id": product_id,
                "data": {
                    "product_id": product_id,
                    "stock": product.current_stock,
                },
                "updated_at": stock_info["updated_at"],
                "action": "updated"
            })
    
    # Sales (created)
    sale_statement = select(Sale).where(
        Sale.business_id == business_id,
        Sale.created_at >= since
    ).order_by(Sale.created_at.desc()).limit(100)  # Limit to prevent huge payloads
    
    sales = session.exec(sale_statement).all()
    for sale in sales:
        # Get sale items
        sale_items = session.exec(
            select(SaleItem).where(SaleItem.sale_id == sale.id)
        ).all()
        
        changes.append({
            "type": "sale",
            "entity_id": sale.id,
            "data": {
                "id": sale.id,
                "total": sale.total,
                "payment_method": sale.payment_method,
                "created_at": sale.created_at.isoformat(),
                "items": [
                    {
                        "product_id": item.product_id,
                        "product_name": item.product_name,
                        "quantity": item.quantity,
                        "unit_price": item.unit_price,
                        "subtotal": item.subtotal
                    }
                    for item in sale_items
                ]
            },
            "updated_at": sale.created_at,
            "action": "created"
        })
    
    # Sort by updated_at
    changes.sort(key=lambda x: x["updated_at"])
    
    return changes


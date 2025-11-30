"""
Stock Take service for inventory counting and shrinkage management
"""
from sqlmodel import Session, select, func
from typing import List, Optional, Dict, Any
from datetime import datetime
from app.models.stock_take import StockTakeSession, StockTakeLine, StockAdjustment
from app.models.product import Product
from app.models.inventory_movement import InventoryMovement
from app.services.activity_service import log_activity


def create_stock_take_session(
    session: Session,
    user_id: int,
    business_id: int,
    branch_id: Optional[int] = None,
    notes: Optional[str] = None
) -> StockTakeSession:
    """Create a new stock take session"""
    stock_take = StockTakeSession(
        user_id=user_id,
        business_id=business_id,
        branch_id=branch_id,
        notes=notes,
        status="open"
    )
    session.add(stock_take)
    session.commit()
    session.refresh(stock_take)
    
    # Log activity
    log_activity(
        session=session,
        user_id=user_id,
        action_type="stock_take_started",
        entity_type="stock_take_session",
        entity_id=stock_take.id,
        description=f"Started stock take session #{stock_take.id}"
    )
    
    return stock_take


def add_stock_take_counts(
    session: Session,
    session_id: int,
    user_id: int,
    counts: List[Dict[str, Any]]
) -> StockTakeSession:
    """
    Add counts to a stock take session
    
    counts: List of {product_id, counted_qty, notes}
    """
    stock_take = session.get(StockTakeSession, session_id)
    if not stock_take:
        raise ValueError("Stock take session not found")
    
    if stock_take.status != "open":
        raise ValueError("Stock take session is not open")
    
    for count_data in counts:
        product_id = count_data['product_id']
        counted_qty = count_data['counted_qty']
        notes = count_data.get('notes')
        
        # Get product
        product = session.get(Product, product_id)
        if not product or product.business_id != stock_take.business_id:
            continue
        
        # Get or create line
        line_statement = select(StockTakeLine).where(
            StockTakeLine.session_id == session_id,
            StockTakeLine.product_id == product_id
        )
        line = session.exec(line_statement).first()
        
        if not line:
            line = StockTakeLine(
                session_id=session_id,
                product_id=product_id,
                expected_qty=product.current_stock,
                counted_by=user_id
            )
        
        # Update counts
        line.counted_qty = counted_qty
        line.difference = counted_qty - line.expected_qty
        
        if line.difference < 0:
            line.difference_type = "loss"
        elif line.difference > 0:
            line.difference_type = "over"
        else:
            line.difference_type = "match"
        
        # Calculate value
        line.unit_cost = product.purchase_price or 0.0
        line.difference_value = abs(line.difference) * line.unit_cost
        
        line.counted_at = datetime.utcnow()
        if notes:
            line.notes = notes
        
        session.add(line)
    
    # Update session totals
    _update_session_totals(session, stock_take)
    session.commit()
    session.refresh(stock_take)
    
    return stock_take


def _update_session_totals(session: Session, stock_take: StockTakeSession):
    """Update session totals from lines"""
    lines_statement = select(StockTakeLine).where(
        StockTakeLine.session_id == stock_take.id
    )
    lines = session.exec(lines_statement).all()
    
    stock_take.total_items_counted = len([l for l in lines if l.counted_qty is not None])
    stock_take.total_differences = len([l for l in lines if l.difference != 0])
    
    losses = [l for l in lines if l.difference_type == "loss"]
    overs = [l for l in lines if l.difference_type == "over"]
    
    stock_take.total_loss_value = sum(l.difference_value for l in losses)
    stock_take.total_gain_value = sum(l.difference_value for l in overs)


def approve_stock_take(
    session: Session,
    session_id: int,
    user_id: int,
    notes: Optional[str] = None
) -> StockTakeSession:
    """
    Approve stock take and apply adjustments
    
    Creates StockAdjustment records and updates product stock
    """
    stock_take = session.get(StockTakeSession, session_id)
    if not stock_take:
        raise ValueError("Stock take session not found")
    
    if stock_take.status != "review":
        raise ValueError("Stock take must be in review status")
    
    # Get all lines with differences
    lines_statement = select(StockTakeLine).where(
        StockTakeLine.session_id == session_id,
        StockTakeLine.counted_qty.isnot(None),
        StockTakeLine.difference != 0
    )
    lines = session.exec(lines_statement).all()
    
    # Apply adjustments
    adjustments = []
    for line in lines:
        product = session.get(Product, line.product_id)
        if not product:
            continue
        
        previous_qty = product.current_stock
        new_qty = line.counted_qty
        
        # Update product stock
        product.current_stock = new_qty
        product.updated_at = datetime.utcnow()
        session.add(product)
        
        # Create adjustment record
        adjustment = StockAdjustment(
            business_id=stock_take.business_id,
            branch_id=stock_take.branch_id,
            product_id=product.id,
            previous_qty=previous_qty,
            new_qty=new_qty,
            difference=line.difference,
            reason="stock_take",
            session_id=session_id,
            unit_cost=line.unit_cost or 0.0,
            adjustment_value=line.difference_value,
            notes=notes or line.notes,
            adjusted_by=user_id
        )
        session.add(adjustment)
        adjustments.append(adjustment)
        
        # Create inventory movement
        movement = InventoryMovement(
            business_id=stock_take.business_id,
            branch_id=stock_take.branch_id,
            product_id=product.id,
            movement_type="adjustment",
            quantity=line.difference,
            reference_id=session_id,
            reference_type="stock_take",
            notes=f"Stock take adjustment: {line.difference_type}"
        )
        session.add(movement)
    
    # Update session status
    stock_take.status = "approved"
    stock_take.completed_at = datetime.utcnow()
    if notes:
        stock_take.notes = notes
    session.add(stock_take)
    
    session.commit()
    session.refresh(stock_take)
    
    # Log activity
    log_activity(
        session=session,
        user_id=user_id,
        action_type="stock_take_approved",
        entity_type="stock_take_session",
        entity_id=session_id,
        description=f"Approved stock take #{session_id} with {len(adjustments)} adjustments"
    )
    
    return stock_take


def get_stock_take_summary(
    session: Session,
    session_id: int
) -> Dict[str, Any]:
    """Get summary statistics for a stock take session"""
    stock_take = session.get(StockTakeSession, session_id)
    if not stock_take:
        raise ValueError("Stock take session not found")
    
    # Get all products for business
    products_statement = select(Product).where(
        Product.business_id == stock_take.business_id
    )
    all_products = session.exec(products_statement).all()
    
    # Get all lines
    lines_statement = select(StockTakeLine).where(
        StockTakeLine.session_id == session_id
    )
    lines = session.exec(lines_statement).all()
    
    counted_product_ids = {line.product_id for line in lines if line.counted_qty is not None}
    uncounted_count = len(all_products) - len(counted_product_ids)
    
    losses = [l for l in lines if l.difference_type == "loss"]
    overs = [l for l in lines if l.difference_type == "over"]
    matches = [l for l in lines if l.difference_type == "match"]
    
    return {
        "total_items": len(all_products),
        "items_counted": len(counted_product_ids),
        "items_uncounted": uncounted_count,
        "losses_count": len(losses),
        "overs_count": len(overs),
        "matches_count": len(matches),
        "total_loss_value": stock_take.total_loss_value,
        "total_gain_value": stock_take.total_gain_value,
        "net_difference": stock_take.total_gain_value - stock_take.total_loss_value
    }


def get_shrinkage_report(
    session: Session,
    session_id: int
) -> Dict[str, Any]:
    """Generate shrinkage report for a stock take session"""
    stock_take = session.get(StockTakeSession, session_id)
    if not stock_take:
        raise ValueError("Stock take session not found")
    
    # Get lines with differences
    lines_statement = select(StockTakeLine).where(
        StockTakeLine.session_id == session_id,
        StockTakeLine.counted_qty.isnot(None)
    ).order_by(StockTakeLine.difference_value.desc())
    lines = session.exec(lines_statement).all()
    
    # Top losses (by value)
    losses = sorted(
        [l for l in lines if l.difference_type == "loss"],
        key=lambda x: x.difference_value,
        reverse=True
    )[:10]
    
    # Top overs (by value)
    overs = sorted(
        [l for l in lines if l.difference_type == "over"],
        key=lambda x: x.difference_value,
        reverse=True
    )[:10]
    
    # Highest variance (by absolute difference)
    variances = sorted(
        lines,
        key=lambda x: abs(x.difference),
        reverse=True
    )[:10]
    
    # Format results
    def format_line(line: StockTakeLine) -> dict:
        product = session.get(Product, line.product_id)
        return {
            "product_id": line.product_id,
            "product_name": product.name if product else "Unknown",
            "expected_qty": line.expected_qty,
            "counted_qty": line.counted_qty,
            "difference": line.difference,
            "difference_value": line.difference_value,
        }
    
    return {
        "session_id": session_id,
        "session_date": stock_take.started_at,
        "total_loss_value": stock_take.total_loss_value,
        "total_gain_value": stock_take.total_gain_value,
        "net_difference": stock_take.total_gain_value - stock_take.total_loss_value,
        "top_losses": [format_line(l) for l in losses],
        "top_overs": [format_line(l) for l in overs],
        "highest_variance": [format_line(l) for l in variances],
        "counted_by": f"User {stock_take.user_id}",  # Could join user table
        "notes": stock_take.notes
    }


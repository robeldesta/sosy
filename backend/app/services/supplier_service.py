from sqlmodel import Session, select
from typing import List, Optional
from app.models.supplier import Supplier
from app.schemas.supplier import SupplierCreate, SupplierUpdate


def create_supplier(session: Session, business_id: int, supplier_data: SupplierCreate) -> Supplier:
    """Create a new supplier"""
    supplier = Supplier(**supplier_data.model_dump(), business_id=business_id)
    session.add(supplier)
    session.commit()
    session.refresh(supplier)
    return supplier


def get_supplier(session: Session, supplier_id: int, business_id: int) -> Optional[Supplier]:
    """Get a supplier by ID, ensuring it belongs to the business"""
    supplier = session.get(Supplier, supplier_id)
    if supplier and supplier.business_id == business_id:
        return supplier
    return None


def list_suppliers(session: Session, business_id: int) -> List[Supplier]:
    """List all suppliers for a business"""
    statement = select(Supplier).where(Supplier.business_id == business_id)
    return list(session.exec(statement).all())


def update_supplier(
    session: Session,
    supplier_id: int,
    business_id: int,
    supplier_data: SupplierUpdate
) -> Optional[Supplier]:
    """Update a supplier"""
    supplier = get_supplier(session, supplier_id, business_id)
    if not supplier:
        return None
    
    update_data = supplier_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(supplier, field, value)
    
    session.add(supplier)
    session.commit()
    session.refresh(supplier)
    return supplier


def delete_supplier(session: Session, supplier_id: int, business_id: int) -> bool:
    """Delete a supplier"""
    supplier = get_supplier(session, supplier_id, business_id)
    if not supplier:
        return False
    
    session.delete(supplier)
    session.commit()
    return True



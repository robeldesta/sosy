from sqlmodel import Session, select
from app.models.stock import LegacyStockItem as StockItem
from app.schemas.stock import StockItemCreate


def get_stock_items_by_business(session: Session, business_id: int) -> list[StockItem]:
    """Get all stock items for a business"""
    statement = select(StockItem).where(StockItem.business_id == business_id)
    return list(session.exec(statement).all())


def create_stock_item(session: Session, business_id: int, stock_data: StockItemCreate) -> StockItem:
    """Create a new stock item"""
    stock_item = StockItem(**stock_data.model_dump(), business_id=business_id)
    session.add(stock_item)
    session.commit()
    session.refresh(stock_item)
    return stock_item


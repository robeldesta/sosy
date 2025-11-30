from sqlmodel import SQLModel, Field, Relationship
from typing import Optional, List, TYPE_CHECKING
from datetime import datetime
from app.models.business import Business

if TYPE_CHECKING:
    from app.models.inventory_stock import StockItem
    from app.models.inventory_movement import InventoryMovement


class Product(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    business_id: int = Field(foreign_key="business.id", index=True)
    branch_id: Optional[int] = Field(default=None, foreign_key="branch.id", index=True)  # Multi-branch support
    name: str
    sku: Optional[str] = Field(default=None, index=True)  # Stock Keeping Unit
    barcode: Optional[str] = Field(default=None, index=True)  # Barcode/EAN
    category: Optional[str] = None
    unit_of_measure: str = Field(default="pcs")  # pcs, kg, pack, box, etc.
    buying_price: float  # Cost price / Purchase price
    selling_price: float  # Sale price / Retail price
    low_stock_threshold: Optional[float] = None  # Minimum stock alert level
    reorder_quantity: Optional[float] = None  # Suggested reorder quantity
    supplier_id: Optional[int] = Field(default=None, foreign_key="supplier.id")  # Primary supplier
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    business: Optional[Business] = Relationship()
    stock_items: List["StockItem"] = Relationship(back_populates="product")
    movements: List["InventoryMovement"] = Relationship(back_populates="product")
    
    # Property aliases for consistency
    @property
    def purchase_price(self) -> float:
        """Alias for buying_price"""
        return self.buying_price
    
    @property
    def sale_price(self) -> float:
        """Alias for selling_price"""
        return self.selling_price
    
    @property
    def min_stock(self) -> Optional[float]:
        """Alias for low_stock_threshold"""
        return self.low_stock_threshold
    
    @property
    def unit(self) -> str:
        """Alias for unit_of_measure"""
        return self.unit_of_measure


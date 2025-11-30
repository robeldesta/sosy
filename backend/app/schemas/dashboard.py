from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime


class LowStockProduct(BaseModel):
    product_id: int
    product_name: str
    current_stock: float
    reorder_point: float
    unit_of_measure: str


class TopProduct(BaseModel):
    product_id: int
    product_name: str
    quantity_sold: float
    revenue: float


class ActivityLogResponse(BaseModel):
    id: int
    timestamp: str
    action_type: str
    description: str
    metadata: Dict[str, Any]


class DashboardResponse(BaseModel):
    today_sales: float
    today_purchases: float
    low_stock: List[LowStockProduct]
    top_products_7_days: List[TopProduct]
    recent_activity: List[ActivityLogResponse]


class QuickSellRequest(BaseModel):
    product_id: int
    quantity: float
    customer_name: Optional[str] = None


class DailySummaryResponse(BaseModel):
    date: str
    sales: float
    purchases: float
    top_products: List[TopProduct]
    low_stock_count: int


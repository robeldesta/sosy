"""
Stock Take schemas for request/response validation
"""
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class StockTakeSessionCreate(BaseModel):
    notes: Optional[str] = None
    branch_id: Optional[int] = None


class StockTakeLineCreate(BaseModel):
    product_id: int
    counted_qty: int
    notes: Optional[str] = None


class StockTakeCountRequest(BaseModel):
    lines: List[StockTakeLineCreate]


class StockTakeLineResponse(BaseModel):
    id: int
    product_id: int
    product_name: str
    expected_qty: int
    counted_qty: Optional[int]
    difference: int
    difference_type: Optional[str]
    difference_value: float
    counted_at: Optional[datetime]
    notes: Optional[str]

    class Config:
        from_attributes = True


class StockTakeSessionResponse(BaseModel):
    id: int
    started_at: datetime
    completed_at: Optional[datetime]
    status: str
    notes: Optional[str]
    total_items_counted: int
    total_differences: int
    total_loss_value: float
    total_gain_value: float
    lines: List[StockTakeLineResponse] = []

    class Config:
        from_attributes = True


class StockTakeSummary(BaseModel):
    total_items: int
    items_counted: int
    items_uncounted: int
    losses_count: int
    overs_count: int
    matches_count: int
    total_loss_value: float
    total_gain_value: float
    net_difference: float


class ShrinkageReport(BaseModel):
    session_id: int
    session_date: datetime
    total_loss_value: float
    total_gain_value: float
    net_difference: float
    top_losses: List[dict]
    top_overs: List[dict]
    highest_variance: List[dict]
    counted_by: str
    notes: Optional[str]


"""
Daily business metrics for analytics
"""
from sqlmodel import SQLModel, Field, UniqueConstraint
from typing import Optional
from datetime import datetime, date


class BusinessMetricsDaily(SQLModel, table=True):
    """Daily aggregated business metrics"""
    __tablename__ = "businessmetricsdaily"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    business_id: int = Field(index=True)
    branch_id: Optional[int] = Field(default=None, index=True)
    metric_date: date = Field(index=True)
    
    # Sales metrics
    total_sales: float = Field(default=0.0)
    total_invoices: int = Field(default=0)
    total_revenue: float = Field(default=0.0)
    
    # Expense metrics
    total_expenses: float = Field(default=0.0)
    expense_count: int = Field(default=0)
    
    # Profit
    profit: float = Field(default=0.0)
    
    # Customer metrics
    customers_count: int = Field(default=0)
    new_customers: int = Field(default=0)
    credit_sales: float = Field(default=0.0)
    
    # Stock metrics
    stock_value: float = Field(default=0.0)
    stock_movements: int = Field(default=0)
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Unique constraint
    __table_args__ = (
        UniqueConstraint("business_id", "branch_id", "metric_date", name="uq_business_metrics"),
    )


from sqlmodel import SQLModel, Field, Relationship
from typing import Optional, TYPE_CHECKING
from datetime import datetime

if TYPE_CHECKING:
    from app.models.business import Business
    from app.models.branch import Branch


class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    telegram_id: int = Field(unique=True, index=True)
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    username: Optional[str] = None
    photo_url: Optional[str] = None
    role: str = Field(default="staff")  # owner, manager, staff
    business_id: Optional[int] = Field(default=None, foreign_key="business.id", index=True)
    branch_id: Optional[int] = Field(default=None, foreign_key="branch.id", index=True)
    pin_hash: Optional[str] = None  # Hashed PIN for staff access
    subscription_status: str = Field(default="free")  # free, active, expired
    subscription_expires_at: Optional[datetime] = None
    last_login_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


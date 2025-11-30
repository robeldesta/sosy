"""
User invite model for staff onboarding
"""
from sqlmodel import SQLModel, Field, Relationship
from typing import Optional
from datetime import datetime, timedelta
from app.models.business import Business
from app.models.user import User


class Invite(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    business_id: int = Field(foreign_key="business.id", index=True)
    code: str = Field(unique=True, index=True)  # Unique invite code
    role: str = Field(default="staff")  # owner, manager, staff
    branch_id: Optional[int] = Field(default=None, foreign_key="branch.id")
    created_by: Optional[int] = Field(default=None, foreign_key="user.id")
    expires_at: datetime
    used_by: Optional[int] = Field(default=None, foreign_key="user.id")  # User who used the invite
    used_at: Optional[datetime] = None
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    business: Optional[Business] = Relationship()
    creator: Optional[User] = Relationship(
        sa_relationship_kwargs={"lazy": "joined", "primaryjoin": "Invite.created_by == User.id"}
    )
    used_by_user: Optional[User] = Relationship(
        sa_relationship_kwargs={"lazy": "joined", "primaryjoin": "Invite.used_by == User.id"}
    )


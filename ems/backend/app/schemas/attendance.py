from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.schemas.user import UserSummary


class AttendanceRead(BaseModel):
    id: int
    user_id: int
    user: UserSummary
    event_type: str
    note: str | None = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

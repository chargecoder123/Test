from pydantic import BaseModel, ConfigDict, Field


class PermissionCreate(BaseModel):
    name: str = Field(min_length=2, max_length=80)
    key: str = Field(min_length=2, max_length=80, pattern=r"^[a-z][a-z0-9_]*$")
    description: str | None = Field(default=None, max_length=255)


class PermissionUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=80)
    key: str | None = Field(default=None, min_length=2, max_length=80, pattern=r"^[a-z][a-z0-9_]*$")
    description: str | None = Field(default=None, max_length=255)


class PermissionRead(BaseModel):
    id: int
    name: str
    key: str
    description: str | None = None
    is_system: bool = False

    model_config = ConfigDict(from_attributes=True)


class PermissionGrantCreate(BaseModel):
    permission_id: int
    can_view: bool = False
    can_create: bool = False
    can_update: bool = False
    can_delete: bool = False


class PermissionGrantRead(BaseModel):
    id: int
    permission_id: int
    name: str
    key: str
    can_view: bool
    can_create: bool
    can_update: bool
    can_delete: bool


class PermissionBatch(BaseModel):
    permissions: list[PermissionGrantCreate] = Field(default_factory=list)

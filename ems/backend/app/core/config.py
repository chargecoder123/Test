import json
from functools import lru_cache
from typing import Annotated

from pydantic import field_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Northstar EMS"
    api_v1_prefix: str = "/api/v1"
    database_url: str = "mysql+pymysql://root:password@localhost:3306/ems"
    secret_key: str = ""
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7
    cors_origins: Annotated[list[str], NoDecode] = ["http://localhost:5173"]
    admin_email: str | None = None
    admin_password: str | None = None
    admin_first_name: str = "System"
    admin_last_name: str = "Administrator"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, value: object) -> object:
        if isinstance(value, str):
            raw = value.strip()
            if raw.startswith("["):
                try:
                    decoded = json.loads(raw)
                    if isinstance(decoded, list):
                        return [str(origin).strip() for origin in decoded if str(origin).strip()]
                except json.JSONDecodeError:
                    pass
            return [origin.strip() for origin in raw.split(",") if origin.strip()]
        return value


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()

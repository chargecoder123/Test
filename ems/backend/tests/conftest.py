import os
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

backend_dir = Path(__file__).resolve().parents[1]
test_database = backend_dir / "test_ems.db"
test_database.unlink(missing_ok=True)
os.environ["DATABASE_URL"] = f"sqlite:///{test_database}"
os.environ["SECRET_KEY"] = "test-only-signing-key-with-at-least-32-bytes"
os.environ["ADMIN_EMAIL"] = "admin@example.com"
os.environ["ADMIN_PASSWORD"] = "test-admin-password-123"
os.environ["CORS_ORIGINS"] = "http://localhost:5173"

from app.main import app


@pytest.fixture(scope="session")
def client():
    with TestClient(app) as test_client:
        yield test_client

"""Pytest configuration and fixtures."""
import os
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from fastapi.testclient import TestClient
import sys
from pathlib import Path

# Minimal test env so Settings() can load during imports.
os.environ["JWT_SECRET"] = os.environ.get("JWT_SECRET", "test-jwt-secret")
os.environ["SUPABASE_URL"] = os.environ.get("SUPABASE_URL", "https://example.supabase.co")
os.environ["SUPABASE_KEY"] = os.environ.get("SUPABASE_KEY", "test-supabase-key")
os.environ["DATABASE_URL"] = os.environ.get("DATABASE_URL", "postgresql://localhost:5432/ayn_platform")
os.environ["DEBUG"] = "false"

# Ensure `app` and `main` imports resolve regardless of pytest cwd.
BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

# Patch DB before importing app so lifespan and get_db use mocks
@pytest.fixture(scope="session")
def mock_db():
    """Mock Prisma client for tests that don't need a real DB."""
    db = MagicMock()
    db.user.find_first = AsyncMock(return_value=None)
    db.user.find_unique = AsyncMock(return_value=None)
    db.user.create = AsyncMock(return_value=MagicMock(
        id="user-1",
        name="Test",
        email="test@example.com",
        role="ADMIN",
        institutionId=None,
        createdAt=MagicMock(),
        updatedAt=MagicMock()
    ))
    return db


@pytest.fixture(scope="session")
def client(mock_db):
    """Test client with mocked DB."""
    with patch("app.core.db.connect_db", AsyncMock(return_value=None)), \
         patch("app.core.db.disconnect_db", AsyncMock(return_value=None)), \
         patch("app.core.db.get_db", return_value=mock_db):
        from main import app
        with TestClient(app) as c:
            yield c

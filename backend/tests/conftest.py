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
    from datetime import datetime, timezone
    
    # Configure mock user
    user = MagicMock()
    user.id = "user-1"
    user.name = "Test"
    user.email = "test@example.com"
    user.role = "ADMIN"
    user.institutionId = None
    user.createdAt = datetime.now(timezone.utc)
    user.updatedAt = datetime.now(timezone.utc)
    
    # Configure updated user
    updated_user = MagicMock()
    updated_user.id = "user-1"
    updated_user.name = "Test"
    updated_user.email = "test@example.com"
    updated_user.role = "ADMIN"
    updated_user.institutionId = "inst-1"
    updated_user.createdAt = datetime.now(timezone.utc)
    updated_user.updatedAt = datetime.now(timezone.utc)
    
    # Configure institution
    institution = MagicMock()
    institution.id = "inst-1"
    institution.name = "Test Institution"
    institution.createdAt = datetime.now(timezone.utc)
    institution.updatedAt = datetime.now(timezone.utc)

    db = MagicMock()
    db.user.find_first = AsyncMock(return_value=None)
    db.user.find_unique = AsyncMock(return_value=None)
    db.user.create = AsyncMock(return_value=user)
    db.institution.create = AsyncMock(return_value=institution)
    db.user.update = AsyncMock(return_value=updated_user)
    return db


@pytest.fixture(scope="session")
def client(mock_db):
    """Test client with mocked DB."""
    import app.core.db as db_module
    original_prisma = db_module.prisma
    original_db = db_module.db
    db_module.prisma = mock_db
    db_module.db = mock_db

    with patch("app.core.db.connect_db", AsyncMock(return_value=None)), \
         patch("app.core.db.disconnect_db", AsyncMock(return_value=None)), \
         patch("app.core.db.get_db", return_value=mock_db):
        from main import app
        with TestClient(app) as c:
            yield c

    db_module.prisma = original_prisma
    db_module.db = original_db


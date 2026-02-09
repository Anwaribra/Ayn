"""Pytest configuration and fixtures."""
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from fastapi.testclient import TestClient

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

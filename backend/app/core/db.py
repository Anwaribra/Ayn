"""Database connection and Prisma client setup."""
from prisma import Prisma
from app.core.config import settings
import os
import logging

logger = logging.getLogger(__name__)


def _build_database_url() -> str | None:
    """
    Return DATABASE_URL with connection pool params injected.

    Supabase's transaction-mode PgBouncer URL defaults Prisma to
    connection_limit=1, which causes pool timeouts under parallel load
    (e.g. dashboard firing 7+ concurrent requests).  We append:
      connection_limit=10   — allows up to 10 concurrent connections
      pool_timeout=30       — wait up to 30 s before giving up

    Safe to call even when DATABASE_URL already has query params.
    """
    url = os.environ.get("DATABASE_URL", "")
    if not url:
        return None
    separator = "&" if "?" in url else "?"
    return f"{url}{separator}connection_limit=10&pool_timeout=30"


_db_url = _build_database_url()

# Global Prisma client instance — datasource_url overrides schema's DATABASE_URL
prisma = Prisma(datasource={"url": _db_url} if _db_url else None)
db = prisma


async def connect_db() -> None:
    """Connect to the database."""
    try:
        await prisma.connect()
        logger.info("Database connected successfully")
    except Exception as e:
        logger.error(f"Failed to connect to database: {e}")
        logger.error("Please ensure:")
        logger.error("1. PostgreSQL is running: sudo service postgresql start")
        logger.error("2. Database exists: Run ./setup_db.sh or create manually")
        logger.error("3. DATABASE_URL in .env is correct")
        raise


async def disconnect_db() -> None:
    """Disconnect from the database."""
    try:
        await prisma.disconnect()
        logger.info("Database disconnected successfully")
    except Exception as e:
        logger.error(f"Failed to disconnect from database: {e}")


def get_db() -> Prisma:
    """Get the Prisma client instance."""
    return prisma


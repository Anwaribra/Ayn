"""Database connection and Prisma client setup."""
import asyncio
import os
import logging
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

from prisma import Prisma

logger = logging.getLogger(__name__)

# Retry config for Supabase cold start / intermittent connectivity
DB_CONNECT_MAX_RETRIES = 5
DB_CONNECT_RETRY_DELAY = 3  # seconds
DB_CONNECT_RETRY_BACKOFF = 1.5


def _build_database_url() -> str | None:
    """
    Return DATABASE_URL with connection pool params injected.

    Supabase's transaction-mode PgBouncer (port 6543) requires:
      pgbouncer=true       — disables prepared statements (pooler doesn't support them)
      connect_timeout=30   — allow time for cold starts / network latency

    We also add:
      connection_limit=10  — allows up to 10 concurrent connections
      pool_timeout=30      — wait up to 30 s before giving up

    Safe to call even when DATABASE_URL already has query params.
    """
    url = os.environ.get("DATABASE_URL", "")
    if not url:
        return None
    parts = urlsplit(url)
    query = dict(parse_qsl(parts.query, keep_blank_values=True))

    # Override low pool limits from incoming URLs so planner/tool paths don't
    # get stuck behind a single-connection pool.
    query["connection_limit"] = os.environ.get("DB_CONNECTION_LIMIT", "10")
    query["pool_timeout"] = os.environ.get("DB_POOL_TIMEOUT", "30")

    if "pooler.supabase.com:6543" in url:
        query["pgbouncer"] = "true"

    query["connect_timeout"] = query.get(
        "connect_timeout",
        "60" if "pooler.supabase.com" in url else "30",
    )

    rebuilt_query = urlencode(query)
    return urlunsplit((parts.scheme, parts.netloc, parts.path, rebuilt_query, parts.fragment))


_db_url = _build_database_url()

# Global Prisma client instance — datasource_url overrides schema's DATABASE_URL
prisma = Prisma(datasource={"url": _db_url} if _db_url else None)
db = prisma


async def connect_db() -> None:
    """Connect to the database with retries for Supabase cold start."""
    last_error = None
    for attempt in range(1, DB_CONNECT_MAX_RETRIES + 1):
        try:
            await prisma.connect()
            logger.info("Database connected successfully")
            return
        except Exception as e:
            last_error = e
            if attempt < DB_CONNECT_MAX_RETRIES:
                delay = DB_CONNECT_RETRY_DELAY * (DB_CONNECT_RETRY_BACKOFF ** (attempt - 1))
                logger.warning(
                    "Database connection attempt %d/%d failed: %s. Retrying in %.1fs...",
                    attempt, DB_CONNECT_MAX_RETRIES, e, delay,
                )
                await asyncio.sleep(delay)
            else:
                logger.error("Failed to connect to database after %d attempts: %s", DB_CONNECT_MAX_RETRIES, e)
                logger.error("Please ensure:")
                logger.error("1. PostgreSQL is running: sudo service postgresql start")
                logger.error("2. Database exists: Run ./setup_db.sh or create manually")
                logger.error("3. DATABASE_URL in .env is correct")
                logger.error("4. If using Supabase: project may be paused — Restore from dashboard")
                raise last_error


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


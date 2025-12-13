"""Database connection and Prisma client setup."""
from prisma import Prisma
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

# Global Prisma client instance
prisma = Prisma()


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


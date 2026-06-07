import os
from collections.abc import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import declarative_base
from dotenv import load_dotenv
from urllib.parse import urlsplit, urlunsplit

load_dotenv()

# We expect an async DB URL like postgresql+asyncpg://user:pass@host/dbname
DATABASE_URL = os.getenv("DATABASE_URL")
if DATABASE_URL:
    if DATABASE_URL.startswith("postgresql://"):
        DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)
    elif DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+asyncpg://", 1)
        
    parts = urlsplit(DATABASE_URL)
    DATABASE_URL = urlunsplit((parts.scheme, parts.netloc, parts.path, "", ""))

# Default for local dev if not set
if not DATABASE_URL:
    DATABASE_URL = "postgresql+asyncpg://postgres:postgres@localhost:5432/ayn"

engine = create_async_engine(
    DATABASE_URL,
    echo=False,
    future=True,
    pool_size=20,
    max_overflow=10,
    connect_args={
        "statement_cache_size": 0,
        "prepared_statement_cache_size": 0,
    }
)

async_session_maker = async_sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False, autoflush=False
)

from sqlalchemy.types import UserDefinedType

class PGVector(UserDefinedType):
    """
    Custom SQLAlchemy type to represent the pgvector extension 'vector' type
    without adding direct dependencies on pgvector.
    """
    def __init__(self, dim: int = 768):
        self.dim = dim

    def get_col_spec(self, **kw):
        return f"vector({self.dim})"

    def bind_processor(self, dialect):
        def process(value):
            if value is None:
                return None
            if isinstance(value, list):
                return "[" + ",".join(map(str, value)) + "]"
            return value
        return process

    def result_processor(self, dialect, coltype):
        def process(value):
            if value is None:
                return None
            # If string representation, parse it
            if isinstance(value, str):
                if value.startswith("[") and value.endswith("]"):
                    value = value[1:-1]
                return [float(x) for x in value.split(",") if x.strip()]
            return value
        return process

class InvalidStateTransitionError(ValueError):
    """Raised when an invalid state transition is attempted on a model state machine."""
    pass

Base = declarative_base()


async def get_db_session() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_maker() as session:
        try:
            yield session
        finally:
            await session.close()

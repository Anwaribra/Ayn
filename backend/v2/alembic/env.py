import asyncio
from logging.config import fileConfig

from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import async_engine_from_config

from alembic import context

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# Interpret the config file for Python logging.
# This line sets up loggers basically.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from v2.core.database import Base, DATABASE_URL
from v2.modules.organizations.models import Organization, Campus, User, UserCampusRole
from v2.modules.evidence.models import Evidence, EvidenceChunk, EvidenceEmbedding, EvidenceValidation
from v2.modules.standards.models import Standard, Criterion, Requirement, CampusStandard, CampusRequirement, DailyReadinessSnapshot
from v2.modules.validation.models import Risk, AISignalLog, FailedEvent, AISignalLogArchive, AIUsageAggregate
from v2.modules.tasks.models import Task
from v2.modules.notifications.models import Notification, NotificationPreference
from v2.modules.horus_operations.models import V2HorusWorkflow, V2HorusActionLog, V2HorusApprovalRequest, V2HorusBriefing, V2MockAudit

target_metadata = Base.metadata
config.set_main_option("sqlalchemy.url", DATABASE_URL)

# other values from the config, defined by the needs of env.py,
# can be acquired:
# my_important_option = config.get_main_option("my_important_option")
# ... etc.


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode.

    This configures the context with just a URL
    and not an Engine, though an Engine is acceptable
    here as well.  By skipping the Engine creation
    we don't even need a DBAPI to be available.

    Calls to context.execute() here emit the given string to the
    script output.

    """
    url = config.get_main_option("sqlalchemy.url")
    def include_object(object, name, type_, reflected, compare_to):
        if type_ == "table" and name and not name.startswith("v2_"):
            return False
        return True

    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        include_object=include_object,
    )

    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection: Connection) -> None:
    def include_object(object, name, type_, reflected, compare_to):
        if type_ == "table" and name and not name.startswith("v2_"):
            return False
        return True

    context.configure(
        connection=connection, 
        target_metadata=target_metadata,
        include_object=include_object
    )

    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    """In this scenario we need to create an Engine
    and associate a connection with the context.

    """

    connectable = async_engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
        connect_args={"statement_cache_size": 0, "prepared_statement_cache_size": 0},
    )

    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)

    await connectable.dispose()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""

    asyncio.run(run_async_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()

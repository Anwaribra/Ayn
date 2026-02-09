"""Run the platform state migration directly."""
import asyncio
import os
from prisma import Prisma

db = Prisma()

MIGRATION_SQL = """
-- Platform Files
CREATE TABLE IF NOT EXISTS "PlatformFile" (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    size INTEGER NOT NULL,
    user_id TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    "detected_standards" TEXT[] DEFAULT '{}',
    "document_type" TEXT,
    clauses TEXT[] DEFAULT '{}',
    "analysis_confidence" FLOAT DEFAULT 0,
    status TEXT DEFAULT 'uploaded',
    "linked_evidence_ids" JSONB DEFAULT '[]',
    "linked_gap_ids" JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_platform_file_user" ON "PlatformFile"(user_id);
CREATE INDEX IF NOT EXISTS "idx_platform_file_status" ON "PlatformFile"(status);

-- Platform Evidence
CREATE TABLE IF NOT EXISTS "PlatformEvidence" (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    type TEXT NOT NULL,
    user_id TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'defined',
    "source_file_ids" JSONB DEFAULT '[]',
    "criteria_refs" JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_platform_evidence_user" ON "PlatformEvidence"(user_id);
CREATE INDEX IF NOT EXISTS "idx_platform_evidence_status" ON "PlatformEvidence"(status);

-- Platform Gaps
CREATE TABLE IF NOT EXISTS "PlatformGap" (
    id TEXT PRIMARY KEY,
    standard TEXT NOT NULL,
    clause TEXT NOT NULL,
    description TEXT NOT NULL,
    severity TEXT DEFAULT 'medium',
    user_id TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'defined',
    evidence_ids JSONB DEFAULT '[]',
    "related_file_ids" JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    closed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS "idx_platform_gap_user" ON "PlatformGap"(user_id);
CREATE INDEX IF NOT EXISTS "idx_platform_gap_status" ON "PlatformGap"(status);
CREATE INDEX IF NOT EXISTS "idx_platform_gap_standard" ON "PlatformGap"(standard);

-- Platform Metrics
CREATE TABLE IF NOT EXISTS "PlatformMetric" (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    value FLOAT NOT NULL,
    "previous_value" FLOAT,
    "source_module" TEXT NOT NULL,
    user_id TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_platform_metric_user" ON "PlatformMetric"(user_id);
CREATE INDEX IF NOT EXISTS "idx_platform_metric_source" ON "PlatformMetric"("source_module");

-- Platform Events
CREATE TABLE IF NOT EXISTS "PlatformEvent" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    type TEXT NOT NULL,
    user_id TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    "entity_id" TEXT,
    metadata JSONB DEFAULT '{}',
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_platform_event_user" ON "PlatformEvent"(user_id);
CREATE INDEX IF NOT EXISTS "idx_platform_event_type" ON "PlatformEvent"(type);
CREATE INDEX IF NOT EXISTS "idx_platform_event_timestamp" ON "PlatformEvent"(timestamp DESC);
"""

async def run_migration():
    await db.connect()
    print("Connected to database")
    
    # Execute raw SQL
    try:
        await db.execute_raw(MIGRATION_SQL)
        print("✅ Migration completed successfully!")
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        raise
    finally:
        await db.disconnect()

if __name__ == "__main__":
    asyncio.run(run_migration())

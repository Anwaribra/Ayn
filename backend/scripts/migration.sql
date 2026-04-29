-- Platform State Migration
-- Run with: psql $DATABASE_URL -f backend/scripts/migration.sql

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

-- Durable async job queue
CREATE TABLE IF NOT EXISTS "AsyncJob" (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'queued',
    priority INTEGER NOT NULL DEFAULT 100,
    attempts INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 3,
    payload JSONB NOT NULL DEFAULT '{}',
    "lastError" TEXT,
    "runAfter" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "lockedAt" TIMESTAMP WITH TIME ZONE,
    "lockedBy" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_async_job_status_run_after" ON "AsyncJob"(status, "runAfter", priority);
CREATE INDEX IF NOT EXISTS "idx_async_job_type_status" ON "AsyncJob"(type, status);
CREATE INDEX IF NOT EXISTS "idx_async_job_created_at" ON "AsyncJob"("createdAt" DESC);

-- Durable event outbox for Redis Stream-backed realtime awareness
CREATE TABLE IF NOT EXISTS "EventOutbox" (
    id TEXT PRIMARY KEY,
    "userId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    source TEXT NOT NULL DEFAULT 'backend',
    payload JSONB NOT NULL DEFAULT '{}',
    "streamId" TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    attempts INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "processedAt" TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS "idx_event_outbox_status_created" ON "EventOutbox"(status, "createdAt");
CREATE INDEX IF NOT EXISTS "idx_event_outbox_user_created" ON "EventOutbox"("userId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "idx_event_outbox_type_status" ON "EventOutbox"(type, status);

-- Horus elite AI memory and analytics metrics
CREATE TABLE IF NOT EXISTS "HorusMemory" (
    id TEXT PRIMARY KEY,
    "userId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    "institutionId" TEXT,
    scope TEXT NOT NULL DEFAULT 'user',
    kind TEXT NOT NULL,
    content TEXT NOT NULL,
    salience DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "sourceChatId" TEXT,
    "contentHash" TEXT NOT NULL,
    "lastUsedAt" TIMESTAMP WITH TIME ZONE,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS "idx_horus_memory_user_hash" ON "HorusMemory"("userId", "contentHash");
CREATE INDEX IF NOT EXISTS "idx_horus_memory_user_salience" ON "HorusMemory"("userId", salience DESC, "updatedAt" DESC);
CREATE INDEX IF NOT EXISTS "idx_horus_memory_institution" ON "HorusMemory"("institutionId", kind, salience DESC);

CREATE TABLE IF NOT EXISTS "AIUsageMetric" (
    id TEXT PRIMARY KEY,
    "userId" TEXT,
    "institutionId" TEXT,
    feature TEXT NOT NULL DEFAULT 'horus',
    operation TEXT NOT NULL,
    provider TEXT NOT NULL,
    model TEXT,
    "routeReason" TEXT,
    "inputTokens" INTEGER NOT NULL DEFAULT 0,
    "outputTokens" INTEGER NOT NULL DEFAULT 0,
    "estimatedCostUsd" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "latencyMs" INTEGER NOT NULL DEFAULT 0,
    "cacheHit" BOOLEAN NOT NULL DEFAULT FALSE,
    metadata JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_ai_usage_created" ON "AIUsageMetric"("createdAt" DESC);
CREATE INDEX IF NOT EXISTS "idx_ai_usage_user_created" ON "AIUsageMetric"("userId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "idx_ai_usage_feature_operation" ON "AIUsageMetric"(feature, operation, "createdAt" DESC);

-- Hot-path query indexes
CREATE INDEX IF NOT EXISTS "idx_message_chat_timestamp" ON "Message"("chatId", "timestamp" DESC);
CREATE INDEX IF NOT EXISTS "idx_chat_user_updated" ON "Chat"("userId", "updatedAt" DESC);
CREATE INDEX IF NOT EXISTS "idx_activity_user_created" ON "Activity"("userId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "idx_evidence_owner_status_created" ON "Evidence"("ownerId", "status", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "idx_vector_document_user_document" ON "VectorDocument"("userId", "documentId");
CREATE INDEX IF NOT EXISTS "idx_vector_document_institution_standard" ON "VectorDocument"("institutionId", "standardId");
CREATE INDEX IF NOT EXISTS "idx_vector_document_document_chunk" ON "VectorDocument"("documentId", "chunkIndex");

-- pgvector retrieval indexes (no-op if pgvector/operator class is unavailable)
DO $$
BEGIN
    CREATE INDEX IF NOT EXISTS "idx_vector_document_embedding_hnsw"
    ON "VectorDocument"
    USING hnsw ("embedding" vector_cosine_ops)
    WHERE "embedding" IS NOT NULL;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Skipping HNSW vector index: %', SQLERRM;
END $$;

DO $$
BEGIN
    CREATE INDEX IF NOT EXISTS "idx_vector_document_embedding_ivfflat"
    ON "VectorDocument"
    USING ivfflat ("embedding" vector_cosine_ops)
    WITH (lists = 100)
    WHERE "embedding" IS NOT NULL;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Skipping IVFFLAT vector index: %', SQLERRM;
END $$;

-- Verify tables were created
SELECT 'PlatformFile' as table_name, COUNT(*) as count FROM "PlatformFile" UNION ALL
SELECT 'PlatformEvidence', COUNT(*) FROM "PlatformEvidence" UNION ALL
SELECT 'PlatformGap', COUNT(*) FROM "PlatformGap" UNION ALL
SELECT 'PlatformMetric', COUNT(*) FROM "PlatformMetric" UNION ALL
SELECT 'PlatformEvent', COUNT(*) FROM "PlatformEvent" UNION ALL
SELECT 'EventOutbox', COUNT(*) FROM "EventOutbox" UNION ALL
SELECT 'HorusMemory', COUNT(*) FROM "HorusMemory" UNION ALL
SELECT 'AIUsageMetric', COUNT(*) FROM "AIUsageMetric" UNION ALL
SELECT 'AsyncJob', COUNT(*) FROM "AsyncJob";

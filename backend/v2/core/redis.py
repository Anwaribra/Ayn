import os
from urllib.parse import urlsplit
from redis.asyncio import Redis

# Build Redis TCP url dynamically from Upstash REST variables
REST_URL = os.getenv("UPSTASH_REDIS_REST_URL")
REST_TOKEN = os.getenv("UPSTASH_REDIS_REST_TOKEN")

if REST_URL and REST_TOKEN:
    parts = urlsplit(REST_URL)
    # parts.netloc is e.g. "profound-lobster-56815.upstash.io"
    REDIS_URL = f"rediss://default:{REST_TOKEN}@{parts.netloc}:6379"
else:
    # Fallback to local redis
    REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")

def get_redis_client() -> Redis:
    """
    Returns an async Redis client.
    """
    return Redis.from_url(REDIS_URL)

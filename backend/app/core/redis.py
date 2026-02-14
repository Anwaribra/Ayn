
import os
from typing import Optional
from upstash_redis import Redis

class RedisClient:
    """
    Wrapper for Upstash Redis client.
    Handles connection and basic operations.
    """
    
    def __init__(self):
        url = os.environ.get("UPSTASH_REDIS_REST_URL")
        token = os.environ.get("UPSTASH_REDIS_REST_TOKEN")
        
        if url and token:
            self.redis = Redis(url=url, token=token)
            self.enabled = True
        else:
            print("Redis credentials not found. Caching disabled.")
            self.enabled = False
            self.redis = None

    def get(self, key: str) -> Optional[str]:
        """Get value from Redis."""
        if not self.enabled:
            return None
        try:
            return self.redis.get(key)
        except Exception as e:
            print(f"Redis GET error: {e}")
            return None

    def set(self, key: str, value: str, ex: int = 300) -> bool:
        """Set value in Redis with expiration (default 5 mins)."""
        if not self.enabled:
            return False
        try:
            self.redis.set(key, value, ex=ex)
            return True
        except Exception as e:
            print(f"Redis SET error: {e}")
            return False

    def delete(self, key: str) -> bool:
        """Delete key from Redis."""
        if not self.enabled:
            return False
        try:
            self.redis.delete(key)
            return True
        except Exception as e:
            print(f"Redis DELETE error: {e}")
            return False
            
    def delete_pattern(self, match: str):
        """
        Delete keys matching pattern.
        Note: Upstash/HTTP doesn't support SCAN cursor easily in one go, 
        but we can use keys() carefully or just manage specific keys.
        For safety/performance in serverless, best to delete specific keys.
        We'll try to find keys and delete them.
        """
        if not self.enabled:
            return
            
        try:
            # Get keys (be careful with large datasets)
            keys = self.redis.keys(match)
            if keys:
                self.redis.delete(*keys)
        except Exception as e:
            print(f"Redis DELETE PATTERN error: {e}")

# Global instance
redis_client = RedisClient()

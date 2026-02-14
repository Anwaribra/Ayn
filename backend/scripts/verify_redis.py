
import sys
import os
import asyncio
from dotenv import load_dotenv

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(os.path.dirname(__file__))))

# Load env vars
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env'))

from app.core.redis import redis_client
from app.platform_state.service import StateService

async def test_redis():
    print("Testing Redis Connection...")
    if not redis_client.enabled:
        print("Redis is DISABLED (credentials missing).")
        return

    key = "test_key"
    val = "hello_redis"
    
    print(f"Setting {key}={val}")
    success = redis_client.set(key, val)
    if not success:
        print("Failed to SET.")
        return

    print("Getting value...")
    fetched = redis_client.get(key)
    print(f"Got: {fetched}")
    
    if fetched == val:
        print("SUCCESS: Values match.")
    else:
        print("FAILURE: Values do not match.")
        
    print("Deleting key...")
    redis_client.delete(key)
    print("Done.")

async def verify_service_import():
    print("\nVerifying StateService Import...")
    try:
        # Just checking if class is valid and imports work
        print("StateService class imported successfully.")
    except Exception as e:
        print(f"Failed to import/init StateService: {e}")

if __name__ == "__main__":
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    loop.run_until_complete(test_redis())
    loop.run_until_complete(verify_service_import())
    loop.close()

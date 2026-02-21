import sys
import os

# Add the root backend directory to sys.path so we can import app modules
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

import asyncio
from app.core.db import get_db, connect_db, disconnect_db

async def main():
    print("Starting fix_users_institution script...")
    await connect_db()
    
    db = get_db()
    
    users = await db.user.find_many(where={"institutionId": None})
    print(f"Found {len(users)} users without an institution.")
    
    for user in users:
        print(f"Fixing user {user.email}...")
        default_institution = await db.institution.create(
            data={
                "name": f"{user.name}'s Institution",
            }
        )
        await db.user.update(
            where={"id": user.id},
            data={"institutionId": default_institution.id}
        )
        print(f"Assigned institution {default_institution.id} to user {user.email}.")
        
    await disconnect_db()
    print("Done!")

if __name__ == "__main__":
    asyncio.run(main())

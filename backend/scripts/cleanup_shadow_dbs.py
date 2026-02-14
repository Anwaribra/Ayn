import os
import psycopg2
from urllib.parse import urlparse

# Get Direct URL from env or use the one we saw
# We'll try to load from .env manually or just hardcode the prompt's one since we saw it
# But better to load it.

def get_direct_url():
    env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env')
    try:
        with open(env_path, 'r') as f:
            for line in f:
                if line.startswith('DIRECT_URL='):
                    return line.split('=', 1)[1].strip().strip('"').strip("'")
    except Exception:
        pass
    return None

def main():
    url = get_direct_url()
    if not url:
        print("Could not find DIRECT_URL in .env")
        return

    print(f"Connecting to DB...")
    
    try:
        conn = psycopg2.connect(url)
        conn.autocommit = True
        cur = conn.cursor()
        
        # List shadow DBs
        cur.execute("SELECT datname FROM pg_database WHERE datname LIKE 'prisma_migrate_shadow_db_%';")
        rows = cur.fetchall()
        
        if not rows:
            print("No shadow databases found.")
        else:
            for row in rows:
                dbname = row[0]
                print(f"Dropping stuck shadow DB: {dbname}")
                # Terminate connections to this DB first
                cur.execute(f"SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '{dbname}';")
                try:
                    cur.execute(f'DROP DATABASE "{dbname}";')
                    print(f"Dropped {dbname}")
                except Exception as e:
                    print(f"Failed to drop {dbname}: {e}")
                    
        conn.close()
        print("Cleanup complete.")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    main()

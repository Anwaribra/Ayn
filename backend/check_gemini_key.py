#!/usr/bin/env python3
"""Quick script to check if GEMINI_API_KEY is loaded correctly."""
import os
from dotenv import load_dotenv

# Load .env file
load_dotenv()

# Check environment variable
api_key_env = os.getenv('GEMINI_API_KEY')
print(f"From os.getenv('GEMINI_API_KEY'): {api_key_env[:20] + '...' if api_key_env else 'NOT FOUND'}")

# Check via settings
try:
    from app.core.config import settings
    api_key_settings = getattr(settings, 'GEMINI_API_KEY', None)
    print(f"From settings.GEMINI_API_KEY: {api_key_settings[:20] + '...' if api_key_settings else 'NOT FOUND'}")
except Exception as e:
    print(f"Error loading settings: {e}")

# Check .env file directly
env_file = os.path.join(os.path.dirname(__file__), '.env')
if os.path.exists(env_file):
    print(f"\n.env file exists at: {env_file}")
    with open(env_file, 'r') as f:
        lines = f.readlines()
        gemini_lines = [line for line in lines if 'GEMINI_API_KEY' in line]
        if gemini_lines:
            print(f"Found GEMINI_API_KEY in .env:")
            for line in gemini_lines:
                # Don't print the full key, just show it exists
                if '=' in line:
                    key_part = line.split('=')[0]
                    value_part = line.split('=')[1].strip()
                    print(f"  {key_part}={value_part[:20]}... (length: {len(value_part)})")
        else:
            print("GEMINI_API_KEY not found in .env file")
else:
    print(f"\n.env file NOT found at: {env_file}")


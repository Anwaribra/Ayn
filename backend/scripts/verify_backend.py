import sys
import os

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(os.path.dirname(__file__))))

try:
    from app.platform_state.models import PlatformStateManager, PlatformFile
    from app.platform_state.service import StateService
    print("Imports successful.")
except Exception as e:
    print(f"Import failed: {e}")
    sys.exit(1)

print("Backend code syntax check passed.")

"""
Platform State Module

Central state storage for all platform modules.
Horus reads from here only.
Modules write to here.
"""

from .models import PlatformStateManager
from .service import StateService

__all__ = ["PlatformStateManager", "StateService"]

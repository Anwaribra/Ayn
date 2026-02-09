"""
Horus AI - Platform Intelligence

Read-only service.
Produces state observations, never actions.
"""

from .service import HorusService, Observation

__all__ = ["HorusService", "Observation"]

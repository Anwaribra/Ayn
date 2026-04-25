from fastapi import FastAPI

from app.bootstrap.debug_routes import debug_routes_enabled, register_debug_routes
from app.bootstrap.standards_seed import _is_placeholder
from app.core.config import settings
from app.standards.builtin_standards import BUILT_IN_STANDARDS


def _set_debug_flags(monkeypatch, *, debug: bool, enabled: bool):
    monkeypatch.setattr(settings, "DEBUG", debug)
    monkeypatch.setattr(settings, "ENABLE_DEBUG_ENDPOINTS", enabled)


def test_debug_routes_require_explicit_opt_in(monkeypatch):
    _set_debug_flags(monkeypatch, debug=True, enabled=False)
    assert debug_routes_enabled() is False

    _set_debug_flags(monkeypatch, debug=True, enabled=True)
    assert debug_routes_enabled() is True

    _set_debug_flags(monkeypatch, debug=False, enabled=True)
    assert debug_routes_enabled() is False


def test_register_debug_routes_only_when_enabled(monkeypatch):
    app = FastAPI()
    _set_debug_flags(monkeypatch, debug=False, enabled=True)
    register_debug_routes(app)
    assert "/api/debug/ai-status" not in {route.path for route in app.routes}

    app_enabled = FastAPI()
    _set_debug_flags(monkeypatch, debug=True, enabled=True)
    register_debug_routes(app_enabled)
    paths = {route.path for route in app_enabled.routes}
    assert "/api/debug/ai-status" in paths
    assert "/api/debug/test-chat" in paths


def test_placeholder_detection_and_seed_payload_present():
    assert _is_placeholder("Requirement for AdvancedCriterion 1")
    assert not _is_placeholder("Mission, Vision, and Strategic Planning")
    assert len(BUILT_IN_STANDARDS) >= 1

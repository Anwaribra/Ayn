"""Criteria router."""
from fastapi import APIRouter

router = APIRouter()


@router.get("/")
async def list_criteria():
    """List all criteria."""
    pass


@router.post("/")
async def create_criterion():
    """Create a new criterion."""
    pass


@router.get("/{criterion_id}")
async def get_criterion(criterion_id: str):
    """Get criterion by ID."""
    pass


@router.put("/{criterion_id}")
async def update_criterion(criterion_id: str):
    """Update criterion."""
    pass


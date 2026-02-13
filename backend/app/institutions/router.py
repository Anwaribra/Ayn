"""Institutions router."""
from fastapi import APIRouter, status, Depends
from typing import List
from app.core.middlewares import get_current_user
from app.auth.dependencies import require_admin
from app.institutions.models import (
    InstitutionCreateRequest,
    InstitutionUpdateRequest,
    InstitutionResponse,
    InstitutionWithUsersResponse,
    AssignUserRequest,
    AssignUserResponse
)
from app.standards.models import LinkStandardRequest, LinkStandardResponse, StandardResponse
from app.institutions.service import InstitutionService
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("", response_model=InstitutionResponse, status_code=status.HTTP_201_CREATED)
async def create_institution(
    request: InstitutionCreateRequest,
    current_user: dict = Depends(require_admin)
):
    """
    Create a new institution.
    """
    return await InstitutionService.create_institution(request, current_user["email"])


@router.put("/{institution_id}", response_model=InstitutionResponse)
async def update_institution(
    institution_id: str,
    request: InstitutionUpdateRequest,
    current_user: dict = Depends(require_admin)
):
    """
    Update an institution.
    """
    return await InstitutionService.update_institution(institution_id, request, current_user["email"])


@router.get("/{institution_id}", response_model=InstitutionWithUsersResponse)
async def get_institution(
    institution_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Fetch institution profile by ID.
    """
    return await InstitutionService.get_institution(institution_id)


@router.post("/{institution_id}/users", response_model=AssignUserResponse, status_code=status.HTTP_200_OK)
async def assign_user_to_institution(
    institution_id: str,
    request: AssignUserRequest,
    current_user: dict = Depends(require_admin)
):
    """
    Assign a user to an institution.
    """
    return await InstitutionService.assign_user(institution_id, request, current_user["email"])


@router.get("", response_model=List[InstitutionResponse])
async def list_institutions(
    current_user: dict = Depends(get_current_user)
):
    """
    List all institutions.
    """
    return await InstitutionService.list_institutions()


@router.post("/{institution_id}/standards", response_model=LinkStandardResponse, status_code=status.HTTP_200_OK)
async def link_standard_to_institution(
    institution_id: str,
    request: LinkStandardRequest,
    current_user: dict = Depends(require_admin)
):
    """
    Link a standard to an institution.
    """
    return await InstitutionService.link_standard(institution_id, request, current_user["email"])


@router.get("/{institution_id}/standards", response_model=List[StandardResponse])
async def list_institution_standards(
    institution_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    List standards linked to an institution.
    """
    return await InstitutionService.list_standards(institution_id, current_user)


@router.delete("/{institution_id}/standards/{standard_id}", status_code=status.HTTP_204_NO_CONTENT)
async def unlink_standard_from_institution(
    institution_id: str,
    standard_id: str,
    current_user: dict = Depends(require_admin)
):
    """
    Unlink a standard from an institution.
    """
    await InstitutionService.unlink_standard(institution_id, standard_id, current_user["email"])

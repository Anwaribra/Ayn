"""Institutions router."""
from fastapi import APIRouter, HTTPException, status, Depends
from typing import List
from app.core.db import get_db
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
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/", response_model=InstitutionResponse, status_code=status.HTTP_201_CREATED)
async def create_institution(
    request: InstitutionCreateRequest,
    current_user: dict = require_admin
):
    """
    Create a new institution.
    
    **Admin only** - Requires ADMIN role.
    
    - **name**: Institution name (required)
    - **description**: Institution description (optional)
    """
    db = get_db()
    
    try:
        institution = await db.institution.create(
            data={
                "name": request.name,
                "description": request.description,
            }
        )
        
        logger.info(f"Admin {current_user['email']} created institution: {institution.id}")
        
        return InstitutionResponse(
            id=institution.id,
            name=institution.name,
            description=institution.description,
            createdAt=institution.createdAt,
            updatedAt=institution.updatedAt
        )
    except Exception:
        logger.exception("Error creating institution")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create institution"
        )


@router.put("/{institution_id}", response_model=InstitutionResponse)
async def update_institution(
    institution_id: str,
    request: InstitutionUpdateRequest,
    current_user: dict = require_admin
):
    """
    Update an institution.
    
    **Admin only** - Requires ADMIN role.
    
    - **name**: Institution name (optional)
    - **description**: Institution description (optional)
    """
    db = get_db()
    
    # Check if institution exists
    institution = await db.institution.find_unique(where={"id": institution_id})
    if not institution:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Institution not found"
        )
    
    # Prepare update data (only include fields that are provided)
    update_data = {}
    if request.name is not None:
        update_data["name"] = request.name
    if request.description is not None:
        update_data["description"] = request.description
    
    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No fields to update"
        )
    
    try:
        updated_institution = await db.institution.update(
            where={"id": institution_id},
            data=update_data
        )
        
        logger.info(f"Admin {current_user['email']} updated institution: {institution_id}")
        
        return InstitutionResponse(
            id=updated_institution.id,
            name=updated_institution.name,
            description=updated_institution.description,
            createdAt=updated_institution.createdAt,
            updatedAt=updated_institution.updatedAt
        )
    except Exception:
        logger.exception("Error updating institution")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update institution"
        )


@router.get("/{institution_id}", response_model=InstitutionWithUsersResponse)
async def get_institution(
    institution_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Fetch institution profile by ID.
    
    Returns institution information including user count.
    """
    db = get_db()
    
    institution = await db.institution.find_unique(
        where={"id": institution_id},
        include={"users": True}
    )
    
    if not institution:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Institution not found"
        )
    
    # Count users
    user_count = len(institution.users) if institution.users else 0
    
    return InstitutionWithUsersResponse(
        id=institution.id,
        name=institution.name,
        description=institution.description,
        createdAt=institution.createdAt,
        updatedAt=institution.updatedAt,
        userCount=user_count
    )


@router.post("/{institution_id}/users", response_model=AssignUserResponse, status_code=status.HTTP_200_OK)
async def assign_user_to_institution(
    institution_id: str,
    request: AssignUserRequest,
    current_user: dict = require_admin
):
    """
    Assign a user to an institution.
    
    **Admin only** - Requires ADMIN role.
    
    - **userId**: ID of the user to assign
    """
    db = get_db()
    
    # Check if institution exists
    institution = await db.institution.find_unique(where={"id": institution_id})
    if not institution:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Institution not found"
        )
    
    # Check if user exists
    user = await db.user.find_unique(where={"id": request.userId})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Update user's institutionId
    try:
        updated_user = await db.user.update(
            where={"id": request.userId},
            data={"institutionId": institution_id}
        )
        
        logger.info(f"Admin {current_user['email']} assigned user {request.userId} to institution {institution_id}")
        
        return AssignUserResponse(
            message="User assigned to institution successfully",
            userId=updated_user.id,
            institutionId=institution_id
        )
    except Exception as e:
        logger.error(f"Error assigning user to institution: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to assign user to institution"
        )


@router.get("/", response_model=List[InstitutionResponse])
async def list_institutions(
    current_user: dict = Depends(get_current_user)
):
    """
    List all institutions.
    
    Returns a list of all institutions in the system.
    """
    db = get_db()
    
    try:
        institutions = await db.institution.find_many(
            order={"createdAt": "desc"}
        )
        
        return [
            InstitutionResponse(
                id=inst.id,
                name=inst.name,
                description=inst.description,
                createdAt=inst.createdAt,
                updatedAt=inst.updatedAt
            )
            for inst in institutions
        ]
    except Exception as e:
        logger.error(f"Error listing institutions: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch institutions"
        )


@router.post("/{institution_id}/standards", response_model=LinkStandardResponse, status_code=status.HTTP_200_OK)
async def link_standard_to_institution(
    institution_id: str,
    request: LinkStandardRequest,
    current_user: dict = require_admin
):
    """
    Link a standard to an institution.
    
    **Admin only** - Requires ADMIN role.
    
    This creates an association between an institution and a standard,
    allowing the institution to use that standard for assessments.
    
    - **standardId**: ID of the standard to link
    """
    db = get_db()
    
    # Check if institution exists
    institution = await db.institution.find_unique(where={"id": institution_id})
    if not institution:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Institution not found"
        )
    
    # Check if standard exists
    standard = await db.standard.find_unique(where={"id": request.standardId})
    if not standard:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Standard not found"
        )
    
    # Create or ensure link exists (unique constraint prevents duplicates)
    try:
        await db.institution_standard.create(
            data={
                "institutionId": institution_id,
                "standardId": request.standardId,
            }
        )
    except Exception as e:
        if "Unique constraint" in str(e) or "unique" in str(e).lower():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Standard is already linked to this institution"
            )
        logger.error(f"Error linking standard: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to link standard"
        )
    
    logger.info(f"Admin {current_user['email']} linked standard {request.standardId} to institution {institution_id}")
    
    return LinkStandardResponse(
        message="Standard linked to institution successfully",
        institutionId=institution_id,
        standardId=request.standardId
    )


@router.get("/{institution_id}/standards", response_model=List[StandardResponse])
async def list_institution_standards(
    institution_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    List standards linked to an institution.
    
    Returns standards that are linked to the given institution.
    """
    db = get_db()
    institution = await db.institution.find_unique(
        where={"id": institution_id},
        include={"institutionStandards": {"include": {"standard": True}}}
    )
    if not institution:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Institution not found"
        )
    if current_user["role"] != "ADMIN" and current_user.get("institutionId") != institution_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    standards = []
    for link in (institution.institutionStandards or []):
        if getattr(link, "standard", None):
            standards.append(link.standard)
    return [
        StandardResponse(id=s.id, title=s.title, description=s.description)
        for s in standards
    ]


@router.delete("/{institution_id}/standards/{standard_id}", status_code=status.HTTP_204_NO_CONTENT)
async def unlink_standard_from_institution(
    institution_id: str,
    standard_id: str,
    current_user: dict = require_admin
):
    """
    Unlink a standard from an institution.
    
    **Admin only** - Requires ADMIN role.
    """
    db = get_db()
    link = await db.institution_standard.find_first(
        where={
            "institutionId": institution_id,
            "standardId": standard_id,
        }
    )
    if not link:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Link not found"
        )
    await db.institution_standard.delete(where={"id": link.id})
    logger.info(f"Admin {current_user['email']} unlinked standard {standard_id} from institution {institution_id}")

"""Standards router."""
from fastapi import APIRouter, HTTPException, status, Depends
from typing import List
from app.core.db import get_db
from app.core.middlewares import get_current_user
from app.auth.dependencies import require_admin
from app.standards.models import (
    StandardCreateRequest,
    StandardUpdateRequest,
    StandardResponse,
    StandardWithCriteriaResponse,
    CriterionCreateRequest,
    CriterionUpdateRequest,
    CriterionResponse
)
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


# ==================== Standards Endpoints ====================

@router.get("/", response_model=List[StandardResponse])
async def list_standards(
    current_user: dict = Depends(get_current_user)
):
    """
    List all standards.
    
    Returns a list of all standards in the system.
    """
    db = get_db()
    
    try:
        standards = await db.standard.find_many()
        
        return [
            StandardResponse(
                id=std.id,
                title=std.title,
                description=std.description
            )
            for std in standards
        ]
    except Exception as e:
        logger.error(f"Error listing standards: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch standards"
        )


@router.post("/", response_model=StandardResponse, status_code=status.HTTP_201_CREATED)
async def create_standard(
    request: StandardCreateRequest,
    current_user: dict = require_admin
):
    """
    Create a new standard.
    
    **Admin only** - Requires ADMIN role.
    
    - **title**: Standard title (required)
    - **description**: Standard description (optional)
    """
    db = get_db()
    
    try:
        standard = await db.standard.create(
            data={
                "title": request.title,
                "description": request.description,
            }
        )
        
        logger.info(f"Admin {current_user['email']} created standard: {standard.id}")
        
        return StandardResponse(
            id=standard.id,
            title=standard.title,
            description=standard.description
        )
    except Exception as e:
        logger.error(f"Error creating standard: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create standard"
        )


@router.put("/{standard_id}", response_model=StandardResponse)
async def update_standard(
    standard_id: str,
    request: StandardUpdateRequest,
    current_user: dict = require_admin
):
    """
    Update a standard.
    
    **Admin only** - Requires ADMIN role.
    
    - **title**: Standard title (optional)
    - **description**: Standard description (optional)
    """
    db = get_db()
    
    # Check if standard exists
    standard = await db.standard.find_unique(where={"id": standard_id})
    if not standard:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Standard not found"
        )
    
    # Prepare update data
    update_data = {}
    if request.title is not None:
        update_data["title"] = request.title
    if request.description is not None:
        update_data["description"] = request.description
    
    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No fields to update"
        )
    
    try:
        updated_standard = await db.standard.update(
            where={"id": standard_id},
            data=update_data
        )
        
        logger.info(f"Admin {current_user['email']} updated standard: {standard_id}")
        
        return StandardResponse(
            id=updated_standard.id,
            title=updated_standard.title,
            description=updated_standard.description
        )
    except Exception as e:
        logger.error(f"Error updating standard: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update standard"
        )


# ==================== Criteria Endpoints ====================

@router.get("/{standard_id}/criteria", response_model=List[CriterionResponse])
async def list_criteria_for_standard(
    standard_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    List all criteria for a specific standard.
    
    Returns all criteria associated with the given standard.
    """
    db = get_db()
    
    # Check if standard exists
    standard = await db.standard.find_unique(where={"id": standard_id})
    if not standard:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Standard not found"
        )
    
    try:
        criteria = await db.criterion.find_many(
            where={"standardId": standard_id}
        )
        
        return [
            CriterionResponse(
                id=crit.id,
                standardId=crit.standardId,
                title=crit.title,
                description=crit.description
            )
            for crit in criteria
        ]
    except Exception as e:
        logger.error(f"Error listing criteria: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch criteria"
        )


@router.post("/{standard_id}/criteria", response_model=CriterionResponse, status_code=status.HTTP_201_CREATED)
async def create_criterion(
    standard_id: str,
    request: CriterionCreateRequest,
    current_user: dict = require_admin
):
    """
    Create a new criterion for a standard.
    
    **Admin only** - Requires ADMIN role.
    
    - **title**: Criterion title (required)
    - **description**: Criterion description (optional)
    """
    db = get_db()
    
    # Check if standard exists
    standard = await db.standard.find_unique(where={"id": standard_id})
    if not standard:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Standard not found"
        )
    
    try:
        criterion = await db.criterion.create(
            data={
                "standardId": standard_id,
                "title": request.title,
                "description": request.description,
            }
        )
        
        logger.info(f"Admin {current_user['email']} created criterion: {criterion.id} for standard: {standard_id}")
        
        return CriterionResponse(
            id=criterion.id,
            standardId=criterion.standardId,
            title=criterion.title,
            description=criterion.description
        )
    except Exception as e:
        logger.error(f"Error creating criterion: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create criterion"
        )


@router.put("/criteria/{criterion_id}", response_model=CriterionResponse)
async def update_criterion(
    criterion_id: str,
    request: CriterionUpdateRequest,
    current_user: dict = require_admin
):
    """
    Update a criterion.
    
    **Admin only** - Requires ADMIN role.
    
    - **title**: Criterion title (optional)
    - **description**: Criterion description (optional)
    """
    db = get_db()
    
    # Check if criterion exists
    criterion = await db.criterion.find_unique(where={"id": criterion_id})
    if not criterion:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Criterion not found"
        )
    
    # Prepare update data
    update_data = {}
    if request.title is not None:
        update_data["title"] = request.title
    if request.description is not None:
        update_data["description"] = request.description
    
    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No fields to update"
        )
    
    try:
        updated_criterion = await db.criterion.update(
            where={"id": criterion_id},
            data=update_data
        )
        
        logger.info(f"Admin {current_user['email']} updated criterion: {criterion_id}")
        
        return CriterionResponse(
            id=updated_criterion.id,
            standardId=updated_criterion.standardId,
            title=updated_criterion.title,
            description=updated_criterion.description
        )
    except Exception as e:
        logger.error(f"Error updating criterion: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update criterion"
        )

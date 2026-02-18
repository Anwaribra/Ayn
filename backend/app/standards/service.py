"""Standards service."""
from fastapi import HTTPException, status
from typing import List
from app.core.db import get_db
from app.standards.models import (
    StandardCreateRequest,
    StandardUpdateRequest,
    StandardResponse,
    CriterionCreateRequest,
    CriterionUpdateRequest,
    CriterionResponse
)
import logging

logger = logging.getLogger(__name__)

class StandardService:
    """Service for standards and criteria business logic."""
    
    @staticmethod
    async def list_standards() -> List[StandardResponse]:
        """List all standards with criteria counts."""
        db = get_db()
        try:
            standards = await db.standard.find_many(
                include={"criteria": True}
            )
            
            results = []
            for std in standards:
                data = StandardResponse.model_validate(std)
                data.criteriaCount = len(std.criteria) if std.criteria else 0
                results.append(data)
            return results
        except Exception as e:
            logger.error(f"Error listing standards: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to fetch standards"
            )
        
    @staticmethod
    async def get_standard(standard_id: str) -> StandardResponse:
        """Get a standard by ID."""
        db = get_db()
        standard = await db.standard.find_unique(
            where={"id": standard_id},
            include={"criteria": True}
        )
        if not standard:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Standard not found"
            )
        
        data = StandardResponse.model_validate(standard)
        data.criteriaCount = len(standard.criteria) if standard.criteria else 0
        return data

    @staticmethod
    async def create_standard(request: StandardCreateRequest, admin_email: str) -> StandardResponse:
        """Create a new standard."""
        db = get_db()
        try:
            standard = await db.standard.create(
                data={
                    "title": request.title,
                    "code": request.code,
                    "category": request.category,
                    "description": request.description,
                    "region": request.region,
                    "icon": request.icon,
                    "color": request.color,
                    "features": request.features,
                    "estimatedSetup": request.estimatedSetup,
                }
            )
            logger.info(f"Admin {admin_email} created standard: {standard.id}")
            return StandardResponse.model_validate(standard)
        except Exception as e:
            logger.error(f"Error creating standard: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create standard"
            )

    @staticmethod
    async def update_standard(standard_id: str, request: StandardUpdateRequest, admin_email: str) -> StandardResponse:
        """Update a standard."""
        db = get_db()
        
        standard = await db.standard.find_unique(where={"id": standard_id})
        if not standard:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Standard not found"
            )
        
        update_data = {k: v for k, v in request.model_dump().items() if v is not None}
        if not update_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No fields to update"
            )
        
        try:
            updated = await db.standard.update(
                where={"id": standard_id},
                data=update_data
            )
            logger.info(f"Admin {admin_email} updated standard: {standard_id}")
            return StandardResponse.model_validate(updated)
        except Exception as e:
            logger.error(f"Error updating standard: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update standard"
            )

    @staticmethod
    async def list_criteria(standard_id: str) -> List[CriterionResponse]:
        """List all criteria for a standard."""
        db = get_db()
        
        standard = await db.standard.find_unique(where={"id": standard_id})
        if not standard:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Standard not found"
            )
        
        try:
            criteria = await db.criterion.find_many(where={"standardId": standard_id})
            return [CriterionResponse.model_validate(crit) for crit in criteria]
        except Exception as e:
            logger.error(f"Error listing criteria: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to fetch criteria"
            )

    @staticmethod
    async def create_criterion(standard_id: str, request: CriterionCreateRequest, admin_email: str) -> CriterionResponse:
        """Create a new criterion."""
        db = get_db()
        
        standard = await db.standard.find_unique(where={"id": standard_id})
        if not standard:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Standard not found")
        
        try:
            criterion = await db.criterion.create(
                data={
                    "standardId": standard_id,
                    "title": request.title,
                    "description": request.description,
                }
            )
            logger.info(f"Admin {admin_email} created criterion: {criterion.id}")
            return CriterionResponse.model_validate(criterion)
        except Exception as e:
            logger.error(f"Error creating criterion: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create criterion"
            )

    @staticmethod
    async def update_criterion(criterion_id: str, request: CriterionUpdateRequest, admin_email: str) -> CriterionResponse:
        """Update a criterion."""
        db = get_db()
        
        criterion = await db.criterion.find_unique(where={"id": criterion_id})
        if not criterion:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Criterion not found")
        
        update_data = {k: v for k, v in request.model_dump().items() if v is not None}
        if not update_data:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No fields to update")
        
        try:
            updated = await db.criterion.update(
                where={"id": criterion_id},
                data=update_data
            )
            logger.info(f"Admin {admin_email} updated criterion: {criterion_id}")
            return CriterionResponse.model_validate(updated)
        except Exception as e:
            logger.error(f"Error updating criterion: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update criterion"
            )

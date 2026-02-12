"""Institutions service."""
from fastapi import HTTPException, status
from typing import List
from app.core.db import get_db
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

class InstitutionService:
    """Service for institutions business logic."""
    
    @staticmethod
    async def create_institution(request: InstitutionCreateRequest, admin_email: str) -> InstitutionResponse:
        """Create a new institution."""
        db = get_db()
        try:
            institution = await db.institution.create(
                data={
                    "name": request.name,
                    "description": request.description,
                }
            )
            logger.info(f"Admin {admin_email} created institution: {institution.id}")
            return InstitutionResponse.model_validate(institution)
        except Exception:
            logger.exception("Error creating institution")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create institution"
            )

    @staticmethod
    async def update_institution(institution_id: str, request: InstitutionUpdateRequest, admin_email: str) -> InstitutionResponse:
        """Update an institution."""
        db = get_db()
        institution = await db.institution.find_unique(where={"id": institution_id})
        if not institution:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Institution not found")
        
        update_data = {k: v for k, v in request.model_dump().items() if v is not None}
        if not update_data:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No fields to update")
        
        try:
            updated = await db.institution.update(where={"id": institution_id}, data=update_data)
            logger.info(f"Admin {admin_email} updated institution: {institution_id}")
            return InstitutionResponse.model_validate(updated)
        except Exception:
            logger.exception("Error updating institution")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update institution"
            )

    @staticmethod
    async def get_institution(institution_id: str) -> InstitutionWithUsersResponse:
        """Fetch institution profile by ID."""
        db = get_db()
        institution = await db.institution.find_unique(
            where={"id": institution_id},
            include={"users": True}
        )
        if not institution:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Institution not found")
        
        user_count = len(institution.users) if institution.users else 0
        return InstitutionWithUsersResponse(
            id=institution.id,
            name=institution.name,
            description=institution.description,
            createdAt=institution.createdAt,
            updatedAt=institution.updatedAt,
            userCount=user_count
        )

    @staticmethod
    async def list_institutions() -> List[InstitutionResponse]:
        """List all institutions."""
        db = get_db()
        try:
            institutions = await db.institution.find_many(order={"createdAt": "desc"})
            return [InstitutionResponse.model_validate(inst) for inst in institutions]
        except Exception as e:
            logger.error(f"Error listing institutions: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to fetch institutions"
            )

    @staticmethod
    async def assign_user(institution_id: str, request: AssignUserRequest, admin_email: str) -> AssignUserResponse:
        """Assign a user to an institution."""
        db = get_db()
        institution = await db.institution.find_unique(where={"id": institution_id})
        if not institution:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Institution not found")
        
        user = await db.user.find_unique(where={"id": request.userId})
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        
        try:
            updated_user = await db.user.update(
                where={"id": request.userId},
                data={"institutionId": institution_id}
            )
            logger.info(f"Admin {admin_email} assigned user {request.userId} to institution {institution_id}")
            return AssignUserResponse(
                message="User assigned to institution successfully",
                userId=updated_user.id,
                institutionId=institution_id
            )
        except Exception as e:
            logger.error(f"Error assigning user: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to assign user"
            )

    @staticmethod
    async def link_standard(institution_id: str, request: LinkStandardRequest, admin_email: str) -> LinkStandardResponse:
        """Link a standard to an institution."""
        db = get_db()
        institution = await db.institution.find_unique(where={"id": institution_id})
        if not institution:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Institution not found")
        
        standard = await db.standard.find_unique(where={"id": request.standardId})
        if not standard:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Standard not found")
        
        try:
            await db.institutionstandard.create(
                data={"institutionId": institution_id, "standardId": request.standardId}
            )
            logger.info(f"Admin {admin_email} linked standard {request.standardId} to institution {institution_id}")
            return LinkStandardResponse(
                message="Standard linked to institution successfully",
                institutionId=institution_id,
                standardId=request.standardId
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

    @staticmethod
    async def list_standards(institution_id: str, current_user: dict) -> List[StandardResponse]:
        """List standards linked to an institution."""
        db = get_db()
        institution = await db.institution.find_unique(
            where={"id": institution_id},
            include={"institutionStandards": {"include": {"standard": True}}}
        )
        if not institution:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Institution not found")
        
        if current_user["role"] != "ADMIN" and current_user.get("institutionId") != institution_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
        
        standards = []
        for link in (institution.institutionStandards or []):
            if getattr(link, "standard", None):
                standards.append(link.standard)
        return [StandardResponse.model_validate(s) for s in standards]

    @staticmethod
    async def unlink_standard(institution_id: str, standard_id: str, admin_email: str):
        """Unlink a standard from an institution."""
        db = get_db()
        link = await db.institutionstandard.find_first(
            where={"institutionId": institution_id, "standardId": standard_id}
        )
        if not link:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Link not found")
        
        await db.institutionstandard.delete(where={"id": link.id})
        logger.info(f"Admin {admin_email} unlinked standard {standard_id} from institution {institution_id}")

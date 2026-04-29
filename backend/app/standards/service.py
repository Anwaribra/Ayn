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
import json
from app.ai.service import get_gemini_client
from app.activity.service import ActivityService

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
            try:
                admin = await db.user.find_unique(where={"email": admin_email})
                if admin:
                    await ActivityService.log_activity(
                        user_id=admin.id,
                        type="standard_snapshot_created",
                        title=f"Standard created: {standard.title}",
                        description=f"Code: {standard.code or 'N/A'}",
                        entity_id=standard.id,
                        entity_type="standard",
                        metadata={
                            "snapshot": {
                                "id": standard.id,
                                "title": standard.title,
                                "code": standard.code,
                                "category": standard.category,
                                "description": standard.description,
                                "region": standard.region,
                            }
                        },
                    )
            except Exception:
                pass
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
            before = {
                "title": standard.title,
                "code": standard.code,
                "category": standard.category,
                "description": standard.description,
                "region": standard.region,
                "icon": standard.icon,
                "color": standard.color,
                "features": standard.features,
                "estimatedSetup": standard.estimatedSetup,
            }
            updated = await db.standard.update(
                where={"id": standard_id},
                data=update_data
            )
            try:
                admin = await db.user.find_unique(where={"email": admin_email})
                if admin:
                    diff = {}
                    for key, old_value in before.items():
                        new_value = getattr(updated, key, None)
                        if new_value != old_value:
                            diff[key] = {"from": old_value, "to": new_value}
                    await ActivityService.log_activity(
                        user_id=admin.id,
                        type="standard_snapshot_updated",
                        title=f"Standard updated: {updated.title}",
                        description=f"Updated {len(diff)} field(s)",
                        entity_id=standard_id,
                        entity_type="standard",
                        metadata={
                            "snapshot": {
                                "id": updated.id,
                                "title": updated.title,
                                "code": updated.code,
                                "category": updated.category,
                                "description": updated.description,
                                "region": updated.region,
                            },
                            "diff": diff,
                        },
                    )
            except Exception:
                pass
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

    @staticmethod
    async def import_standard_from_document(text: str, admin_email: str) -> StandardResponse:
        """
        Use AI to import a standard and its criteria from a document text.
        """
        ai = get_gemini_client()
        prompt = f"""
        Analyze the following text from an accreditation or quality standard document.
        Extract the standard's basic information and a hierarchical list of its criteria.
        
        Guidelines:
        - Title: The official name of the standard (e.g., ISO 21001:2018).
        - Code: Official abbreviation or code (e.g., ISO-21001).
        - Category: Type of standard (e.g., International, Higher Ed, Healthcare).
        - Criteria: A list of requirements. Each requirement MUST have a 'title' (like 'Clause 4.1' or 'Standard 1') and a 'description' (the actual requirement text).
        
        Return ONLY a JSON object in this format:
        {{
            "title": "...",
            "code": "...",
            "category": "...",
            "description": "...",
            "criteria": [
                {{ "title": "...", "description": "..." }},
                ...
            ]
        }}
        
        DOCUMENT TEXT:
        {text[:10000]}
        """
        
        try:
            response_text = await ai.generate_text(prompt)
            # Clean JSON response (strip markdown blocks if present)
            json_str = response_text.replace("```json", "").replace("```", "").strip()
            data = json.loads(json_str)
            
            db = get_db()
            # Create the Standard
            standard = await db.standard.create(
                data={
                    "title": data["title"],
                    "code": data.get("code"),
                    "category": data.get("category", "Imported"),
                    "description": data.get("description"),
                    "icon": "FileCheck",
                    "color": "from-indigo-600 to-purple-600",
                }
            )
            
            # Create Criteria in bulk
            for crit in data.get("criteria", []):
                await db.criterion.create(
                    data={
                        "standardId": standard.id,
                        "title": crit["title"],
                        "description": crit["description"],
                    }
                )
            
            logger.info(f"Admin {admin_email} imported standard {standard.id} from document using AI")
            
            # Fetch with criteria for response
            return await StandardService.get_standard(standard.id)
            
        except Exception as e:
            logger.error(f"AI Import Error: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to import standard using AI: {str(e)}"
            )

    @staticmethod
    async def import_standard_from_pdf(file_bytes: bytes, filename: str) -> StandardResponse:
        """
        Use AI to extract standard name and hierarchical criteria list from a PDF.
        """
        ai = get_gemini_client()
        import base64
        
        # Prepare file for Gemini
        file_data = {
            "type": "document",
            "mime_type": "application/pdf",
            "data": base64.b64encode(file_bytes).decode("utf-8"),
            "filename": filename
        }
        
        prompt = """
        Analyze the provided PDF document which contains an accreditation or quality standard.
        Extract the standard's basic information and a hierarchical list of its criteria.
        
        Guidelines:
        - Title: The official name of the standard (e.g., ISO 21001:2018).
        - Code: Official abbreviation or code (e.g., ISO-21001).
        - Category: Type of standard (e.g., International, Higher Ed).
        - Criteria: A list of requirements. Each MUST have a 'title' and a 'description'.
        
        Return ONLY a JSON object in this format:
        {
            "title": "...",
            "code": "...",
            "category": "...",
            "description": "...",
            "criteria": [
                { "title": "...", "description": "..." },
                ...
            ]
        }
        """
        
        try:
            response_text = await ai.chat_with_files(prompt, [file_data])
            # Clean JSON response
            json_str = response_text.replace("```json", "").replace("```", "").strip()
            data = json.loads(json_str)
            
            db = get_db()
            # Create the Standard as PUBLIC
            standard = await db.standard.create(
                data={
                    "title": data["title"],
                    "code": data.get("code"),
                    "category": data.get("category", "Imported"),
                    "description": data.get("description"),
                    "icon": "FileText",
                    "color": "from-teal-600 to-cyan-600",
                    "isPublic": True,
                    "source": "imported-pdf",
                }
            )
            
            # Create Criteria
            for crit in data.get("criteria", []):
                await db.criterion.create(
                    data={
                        "standardId": standard.id,
                        "title": crit["title"],
                        "description": crit["description"],
                    }
                )
            
            logger.info(f"New standard {standard.id} imported from PDF: {filename}")
            return await StandardService.get_standard(standard.id)
            
        except Exception as e:
            logger.error(f"PDF AI Import Error: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to extract standard from PDF: {str(e)}"
            )

    @staticmethod
    async def get_coverage(standard_id: str, current_user: dict) -> dict:
        """
        Return criteria vs evidence coverage for a standard.
        Counts criteria that have at least one evidence item linked via EvidenceCriterion.
        """
        db = get_db()
        standard = await db.standard.find_unique(
            where={"id": standard_id},
        )
        if not standard:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Standard not found")

        criteria = await db.criterion.find_many(where={"standardId": standard_id})
        criteria_ids = [c.id for c in criteria]
        total = len(criteria_ids)
        covered = 0

        if total > 0:
            try:
                linked = await db.evidencecriterion.find_many(
                    where={"criterionId": {"in": criteria_ids}},
                )
                covered = len({l.criterionId for l in linked})
            except Exception:
                pass  # Table may not exist yet in dev environments

        coverage_pct = round((covered / total) * 100, 1) if total > 0 else 0.0
        logger.info(f"Coverage for standard {standard_id}: {covered}/{total} ({coverage_pct}%)")

        return {
            "standardId": standard_id,
            "totalCriteria": total,
            "coveredCriteria": covered,
            "coveragePct": coverage_pct,
        }

    @staticmethod
    async def get_all_coverage() -> list:
        """
        Batch coverage for ALL standards in 3 queries (instead of 3×N).
        Returns a list of coverage dicts, one per standard.
        """
        db = get_db()

        # 1. All standards
        standards = await db.standard.find_many()
        standard_ids = [s.id for s in standards]
        if not standard_ids:
            return []

        # 2. All criteria grouped by standard
        all_criteria = await db.criterion.find_many(
            where={"standardId": {"in": standard_ids}},
        )
        # Build maps: standard_id -> set of criteria ids, standard_id -> total count
        criteria_by_standard: dict[str, set] = {}
        for c in all_criteria:
            criteria_by_standard.setdefault(c.standardId, set()).add(c.id)

        all_criteria_ids = [c.id for c in all_criteria]

        # 3. All evidence-criterion links (distinct criteria)
        covered_criteria_ids: set = set()
        if all_criteria_ids:
            try:
                links = await db.evidencecriterion.find_many(
                    where={"criterionId": {"in": all_criteria_ids}},
                )
                covered_criteria_ids = {l.criterionId for l in links}
            except Exception:
                pass  # Table may not exist yet

        # 4. Assemble results
        results = []
        for sid in standard_ids:
            crit_ids = criteria_by_standard.get(sid, set())
            total = len(crit_ids)
            covered = len(crit_ids & covered_criteria_ids) if total > 0 else 0
            pct = round((covered / total) * 100, 1) if total > 0 else 0.0
            results.append({
                "standardId": sid,
                "totalCriteria": total,
                "coveredCriteria": covered,
                "coveragePct": pct,
            })

        logger.info(f"Batch coverage: {len(results)} standards processed")
        return results


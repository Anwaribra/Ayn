import uuid
import logging
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from v2.modules.horus_operations.models import V2MockAudit
from v2.modules.standards.models import Standard, Criterion, Requirement, CampusRequirement, CampusStandard, RequirementStatus

logger = logging.getLogger("v2.modules.horus_operations.mock_audit")

class MockAuditService:
    @staticmethod
    async def initiate_mock_audit(db: AsyncSession, campus_id: uuid.UUID, standard_id: uuid.UUID) -> V2MockAudit:
        """
        Creates a mock audit record in RUNNING state, then deterministically calculates
        the audit results based on real requirement coverage and evidence validations.
        """
        audit = V2MockAudit(
            campus_id=campus_id,
            standard_id=standard_id,
            simulation_status="RUNNING"
        )
        db.add(audit)
        await db.commit()
        await db.refresh(audit)
        
        try:
            # 1. Load Standard, criteria, and requirements
            stmt = select(Standard).where(Standard.id == standard_id).options(
                selectinload(Standard.criteria).selectinload(Criterion.requirements)
            )
            standard = (await db.execute(stmt)).scalar_one_or_none()
            
            if not standard:
                audit.simulation_status = "FAILED"
                audit.report_payload = {"error": f"Standard {standard_id} not found."}
                await db.commit()
                return audit

            findings = []
            failed_criteria = set()
            req_ids = []
            req_map = {}

            for criterion in standard.criteria:
                for req in criterion.requirements:
                    req_ids.append(req.id)
                    req_map[req.id] = (req, criterion)

            if req_ids:
                cr_stmt = select(CampusRequirement).where(
                    CampusRequirement.campus_id == campus_id,
                    CampusRequirement.requirement_id.in_(req_ids)
                )
                camp_reqs = (await db.execute(cr_stmt)).scalars().all()
                camp_req_map = {cr.requirement_id: cr for cr in camp_reqs}
            else:
                camp_req_map = {}

            # Retrieve average readiness score from CampusStandard
            camp_std_stmt = select(CampusStandard).where(
                CampusStandard.campus_id == campus_id,
                CampusStandard.standard_id == standard_id
            )
            camp_std = (await db.execute(camp_std_stmt)).scalar_one_or_none()
            overall_score = camp_std.readiness_score if camp_std else 0.0

            # 2. Evaluate requirement statuses to identify gaps and severity
            for req_id, (req, criterion) in req_map.items():
                cr = camp_req_map.get(req_id)
                score = cr.score if cr else 0.0
                status = cr.status if cr else RequirementStatus.NOT_ASSESSED

                # If requirement is not fully met, log a finding
                if score < 1.0 or status != RequirementStatus.FULLY_COVERED:
                    failed_criteria.add(criterion.id)
                    
                    if status == RequirementStatus.NOT_ASSESSED:
                        severity = "CRITICAL"
                        issue = f"Requirement '{req.title}' has not been assessed yet. Missing evidence mappings."
                    elif status == RequirementStatus.PARTIALLY_COVERED:
                        severity = "HIGH"
                        issue = f"Requirement '{req.title}' is only partially covered (Score: {score:.2f})."
                    elif status == RequirementStatus.COVERED:
                        severity = "MEDIUM"
                        issue = f"Requirement '{req.title}' is covered but has not reached full validation status."
                    else:
                        severity = "LOW"
                        issue = f"Requirement '{req.title}' score is {score:.2f} which is below the target 1.0 threshold."

                    findings.append({
                        "criterion": f"{criterion.title} - {req.title}",
                        "issue": issue,
                        "severity": severity
                    })

            audit.simulation_status = "COMPLETED"
            audit.report_payload = {
                "overall_score": overall_score,
                "failed_criteria_count": len(failed_criteria),
                "findings": findings
            }
        except Exception as e:
            logger.error(f"Error evaluating mock audit: {e}")
            audit.simulation_status = "FAILED"
            audit.report_payload = {"error": str(e)}

        await db.commit()
        return audit

    @staticmethod
    async def get_mock_audit(db: AsyncSession, audit_id: uuid.UUID) -> Optional[V2MockAudit]:
        stmt = select(V2MockAudit).where(V2MockAudit.id == audit_id)
        return (await db.execute(stmt)).scalar_one_or_none()


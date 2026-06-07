import uuid
import logging
from datetime import date, datetime, time, timezone
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from v2.modules.horus_operations.models import V2HorusBriefing
from v2.modules.standards.models import CampusStandard
from v2.modules.evidence.models import Evidence, EvidenceValidation
from v2.modules.tasks.models import Task
from v2.modules.validation.models import Risk, RiskSeverity, RiskStatus

logger = logging.getLogger("v2.modules.horus_operations.briefing")

class BriefingService:
    @staticmethod
    async def get_or_generate_daily_briefing(db: AsyncSession, campus_id: uuid.UUID, target_date: date) -> V2HorusBriefing:
        """
        Retrieves the cached briefing for the day, or generates it if it doesn't exist.
        """
        stmt = select(V2HorusBriefing).where(
            V2HorusBriefing.campus_id == campus_id,
            V2HorusBriefing.date == target_date
        )
        briefing = (await db.execute(stmt)).scalar_one_or_none()
        
        if briefing:
            return briefing
            
        # Generate new briefing using real database metrics for the target_date
        today_start = datetime.combine(target_date, time.min).replace(tzinfo=timezone.utc)
        today_end = datetime.combine(target_date, time.max).replace(tzinfo=timezone.utc)

        # Average standard readiness score for the campus
        std_stmt = select(CampusStandard.readiness_score).where(CampusStandard.campus_id == campus_id)
        scores = (await db.execute(std_stmt)).scalars().all()
        avg_readiness = (sum(scores) / len(scores)) if scores else 0.0

        # Number of evidence files uploaded today
        ev_stmt = select(func.count(Evidence.id)).where(
            Evidence.campus_id == campus_id,
            Evidence.created_at >= today_start,
            Evidence.created_at <= today_end
        )
        uploads_count = (await db.execute(ev_stmt)).scalar() or 0

        # Number of validation failures today
        val_stmt = select(func.count(EvidenceValidation.id)).join(
            Evidence, Evidence.id == EvidenceValidation.evidence_id
        ).where(
            Evidence.campus_id == campus_id,
            EvidenceValidation.created_at >= today_start,
            EvidenceValidation.created_at <= today_end,
            EvidenceValidation.status != "COVERED"
        )
        failures_count = (await db.execute(val_stmt)).scalar() or 0

        # Number of tasks created today
        task_stmt = select(func.count(Task.id)).where(
            Task.campus_id == campus_id,
            Task.created_at >= today_start,
            Task.created_at <= today_end
        )
        tasks_count = (await db.execute(task_stmt)).scalar() or 0

        # Number of risks created today
        risk_stmt = select(func.count(Risk.id)).where(
            Risk.campus_id == campus_id,
            Risk.created_at >= today_start,
            Risk.created_at <= today_end
        )
        risks_count = (await db.execute(risk_stmt)).scalar() or 0

        # Number of open high/critical risks
        open_risks_stmt = select(func.count(Risk.id)).where(
            Risk.campus_id == campus_id,
            Risk.status == RiskStatus.OPEN,
            Risk.severity.in_([RiskSeverity.HIGH, RiskSeverity.CRITICAL])
        )
        critical_risks_count = (await db.execute(open_risks_stmt)).scalar() or 0

        summary = (
            f"Daily Compliance Briefing for {target_date.isoformat()}:\n"
            f"Horus observed {uploads_count} new documents uploaded. {failures_count} failed validation resulting in {tasks_count} automated tasks generated. "
            f"Overall readiness score is {(avg_readiness * 100):.1f}%. There are {critical_risks_count} critical/high risks currently open."
        )
        
        new_briefing = V2HorusBriefing(
            campus_id=campus_id,
            date=target_date,
            summary_content=summary
        )
        db.add(new_briefing)
        await db.commit()
        await db.refresh(new_briefing)
        return new_briefing


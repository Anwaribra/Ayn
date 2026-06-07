import uuid
import logging
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from v2.modules.standards.models import Requirement, Criterion, Standard, CampusRequirement, CampusStandard
from v2.core.logging import setup_logger

logger = setup_logger("v2.modules.standards.services")

class ReadinessService:
    @staticmethod
    async def recalculate_readiness_delta(
        db: AsyncSession,
        campus_id: uuid.UUID,
        requirement_id: uuid.UUID
    ) -> float:
        """
        Executes incremental, delta-based weighted readiness calculations up the standard hierarchy.
        Only recalculates the branch affected by the requirement_id update.
        """
        # Get requirement and its parent hierarchy
        req_stmt = select(Requirement).where(Requirement.id == requirement_id)
        requirement = (await db.execute(req_stmt)).scalar_one_or_none()
        if not requirement:
            raise ValueError(f"Requirement {requirement_id} not found")
            
        criterion_id = requirement.criterion_id
        
        # 1. Recalculate Criterion Score for this Campus
        # Fetch all requirements under this Criterion
        reqs_stmt = select(Requirement).where(Requirement.criterion_id == criterion_id)
        reqs = (await db.execute(reqs_stmt)).scalars().all()
        req_ids = [r.id for r in reqs]
        
        # Fetch current campus scores for these requirements
        camp_reqs_stmt = select(CampusRequirement).where(
            CampusRequirement.campus_id == campus_id,
            CampusRequirement.requirement_id.in_(req_ids)
        )
        camp_reqs = (await db.execute(camp_reqs_stmt)).scalars().all()
        camp_req_map = {cr.requirement_id: cr for cr in camp_reqs}
        
        weighted_score_sum = 0.0
        weight_sum = 0.0
        for r in reqs:
            cr = camp_req_map.get(r.id)
            score = cr.score if cr else 0.0
            weighted_score_sum += score * r.weight
            weight_sum += r.weight
            
        criterion_score = (weighted_score_sum / weight_sum) if weight_sum > 0 else 0.0
        logger.info(f"Recalculated Criterion {criterion_id} score: {criterion_score} (weight sum: {weight_sum})")
        
        # 2. Recalculate parent Standard Score for this Campus
        # Get Criterion standard ID
        crit_stmt = select(Criterion).where(Criterion.id == criterion_id)
        criterion = (await db.execute(crit_stmt)).scalar_one_or_none()
        standard_id = criterion.standard_id
        
        # Fetch all criteria under this Standard
        crits_stmt = select(Criterion).where(Criterion.standard_id == standard_id)
        crits = (await db.execute(crits_stmt)).scalars().all()
        
        # For each criterion, compute its campus score.
        # Since we only calculated one criterion's score, we fetch requirements for the other criteria too to aggregate their scores
        criteria_weighted_sum = 0.0
        criteria_weight_sum = 0.0
        
        for c in crits:
            c_weight = c.weight
            c_score = 0.0
            
            if c.id == criterion_id:
                c_score = criterion_score
            else:
                # Calculate other criteria scores in standard
                c_reqs_stmt = select(Requirement).where(Requirement.criterion_id == c.id)
                c_reqs = (await db.execute(c_reqs_stmt)).scalars().all()
                c_req_ids = [r.id for r in c_reqs]
                
                c_camp_reqs_stmt = select(CampusRequirement).where(
                    CampusRequirement.campus_id == campus_id,
                    CampusRequirement.requirement_id.in_(c_req_ids)
                )
                c_camp_reqs = (await db.execute(c_camp_reqs_stmt)).scalars().all()
                c_camp_req_map = {cr.requirement_id: cr for cr in c_camp_reqs}
                
                c_weighted_sum = 0.0
                c_weight_sum = 0.0
                for r in c_reqs:
                    cr = c_camp_req_map.get(r.id)
                    score = cr.score if cr else 0.0
                    c_weighted_sum += score * r.weight
                    c_weight_sum += r.weight
                c_score = (c_weighted_sum / c_weight_sum) if c_weight_sum > 0 else 0.0
                
            criteria_weighted_sum += c_score * c_weight
            criteria_weight_sum += c_weight
            
        standard_score = (criteria_weighted_sum / criteria_weight_sum) if criteria_weight_sum > 0 else 0.0
        standard_score = round(standard_score, 4)
        
        # 3. Update or create CampusStandard record
        camp_std_stmt = select(CampusStandard).where(
            CampusStandard.campus_id == campus_id,
            CampusStandard.standard_id == standard_id
        )
        camp_std = (await db.execute(camp_std_stmt)).scalar_one_or_none()
        
        if not camp_std:
            camp_std = CampusStandard(
                campus_id=campus_id,
                standard_id=standard_id,
                readiness_score=0.0
            )
            db.add(camp_std)
            
        camp_std.readiness_score = standard_score
        
        # 4. Create or update DailyReadinessSnapshot for historical audit trends
        try:
            from datetime import datetime, time
            from v2.modules.standards.models import DailyReadinessSnapshot
            
            today_date = datetime.combine(datetime.now().date(), time.min)
            snapshot_stmt = select(DailyReadinessSnapshot).where(
                DailyReadinessSnapshot.campus_id == campus_id,
                DailyReadinessSnapshot.standard_id == standard_id,
                DailyReadinessSnapshot.date == today_date
            )
            snapshot = (await db.execute(snapshot_stmt)).scalar_one_or_none()
            
            if snapshot:
                snapshot.readiness_score = standard_score
            else:
                snapshot = DailyReadinessSnapshot(
                    campus_id=campus_id,
                    standard_id=standard_id,
                    readiness_score=standard_score,
                    date=today_date
                )
                db.add(snapshot)
        except Exception as e:
            logger.error(f"Error capturing daily readiness snapshot: {e}")
            
        await db.commit()
        
        logger.info(f"Aggregated Standard {standard_id} readiness score to: {standard_score:.4f} for Campus {campus_id}")
        return standard_score

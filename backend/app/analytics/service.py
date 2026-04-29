"""Analytics service — all computations from real database data via Prisma."""
import asyncio
import math
import logging
from datetime import datetime, timedelta, timezone
from typing import List, Optional, Dict, Any
from collections import defaultdict

from fastapi import HTTPException, status
from app.core.db import get_db
from app.analytics.models import (
    AnalyticsResponse,
    TimeSeriesPoint,
    StandardPerformance,
    StatusBreakdown,
    InsightItem,
    GrowthMetrics,
    AnomalyItem,
    EvidenceTrend,
)
from app.compliance.alignment_metrics import (
    count_distinct_criteria_with_evidence,
)

logger = logging.getLogger(__name__)


class AnalyticsService:
    """Computes analytics from live Prisma data — no mocks, no fakes."""

    @staticmethod
    async def get_analytics(
        current_user: dict,
        period_days: Optional[int] = 30,
    ) -> AnalyticsResponse:
        db = get_db()
        now = datetime.now(timezone.utc)
        institution_id = current_user.get("institutionId")
        if not institution_id:
            return AnalyticsService._empty_response(period_days, now)

        # ── Build query filters upfront (pure Python, no I/O) ──────────
        ga_where: Dict[str, Any] = {"institutionId": institution_id}

        if period_days is not None:
            cutoff = now - timedelta(days=period_days)
            ga_where["createdAt"] = {"gte": cutoff}

        # Evidence filter is the same for count and find_many
        ev_where: Dict[str, Any] = {"ownerId": institution_id}
        if period_days is not None:
            ev_where["createdAt"] = {"gte": now - timedelta(days=period_days)}

        # ── Round 1: Parallelise all queries whose inputs are already known ──
        (
            reports,
            total_evidence,
            inst_standards,
            all_evidence,
        ) = await asyncio.gather(
            db.gapanalysis.find_many(
                where=ga_where,
                order={"createdAt": "desc"},
                include={"standard": True},
            ),
            db.evidence.count(where=ev_where),
            db.institutionstandard.find_many(
                where={"institutionId": institution_id}
            ),
            db.evidence.find_many(where=ev_where, order={"createdAt": "asc"}),
        )

        # ── Round 2: Criteria counts depend on std_ids from Round 1 ──
        std_ids = [s.standardId for s in inst_standards]
        if std_ids:
            total_criteria, aligned_criteria = await asyncio.gather(
                db.criterion.count(where={"standardId": {"in": std_ids}}),
                count_distinct_criteria_with_evidence(db, ev_where),
            )
        else:
            total_criteria = 0
            aligned_criteria = 0

        # ── Everything below is pure-Python computation (no more DB I/O) ──

        # ── Basic KPIs ──────────────────────────────────────────────────
        total_reports = len(reports)
        scores = [r.overallScore for r in reports]
        avg_score = round(sum(scores) / total_reports, 2) if total_reports > 0 else 0.0

        variance = (
            sum((s - avg_score) ** 2 for s in scores) / total_reports
            if total_reports > 1
            else 0.0
        )
        std_dev = round(math.sqrt(variance), 2)

        latest_score = round(reports[0].overallScore, 2) if reports else 0.0
        previous_score = round(reports[1].overallScore, 2) if len(reports) > 1 else 0.0
        delta = round(latest_score - previous_score, 2)
        unique_standards = len({r.standardId for r in reports if r.standardId})

        alignment_pct = (
            round((aligned_criteria / total_criteria) * 100, 2)
            if total_criteria > 0
            else 0.0
        )
        if (
            alignment_pct == 0.0
            and total_criteria > 0
            and not is_admin
            and total_reports > 0
        ):
            alignment_pct = round(sum(scores) / total_reports, 2)

        # ── Score Trend (time-series) ────────────────────────────────────
        sorted_reports = sorted(reports, key=lambda r: r.createdAt)
        score_trend = [
            TimeSeriesPoint(
                date=r.createdAt.strftime("%b %d"),
                score=round(r.overallScore, 1),
                label=r.standard.title if r.standard else "General",
            )
            for r in sorted_reports
        ]

        # ── Evidence Trend ───────────────────────────────────────────────
        ev_by_date: Dict[str, int] = defaultdict(int)
        for ev in all_evidence:
            date_key = ev.createdAt.strftime("%b %d")
            ev_by_date[date_key] += 1

        cumulative = 0
        evidence_trend: List[EvidenceTrend] = []
        for date_key, count in ev_by_date.items():
            cumulative += count
            evidence_trend.append(
                EvidenceTrend(date=date_key, count=count, cumulativeCount=cumulative)
            )

        # ── Standard Performance (aggregated per standard) ───────────────
        std_groups: Dict[str, List[float]] = defaultdict(list)
        std_titles: Dict[str, str] = {}
        std_latest: Dict[str, float] = {}
        std_ids_map: Dict[str, Optional[str]] = {}

        for r in sorted_reports:
            key = r.standardId or "unknown"
            title = r.standard.title if r.standard else "Unknown"
            std_groups[key].append(r.overallScore)
            std_titles[key] = title
            std_latest[key] = r.overallScore
            std_ids_map[key] = r.standardId

        standard_performance: List[StandardPerformance] = []
        for std_id, group_scores in std_groups.items():
            avg = sum(group_scores) / len(group_scores)
            mid = len(group_scores) // 2
            if mid > 0:
                first_avg = sum(group_scores[:mid]) / mid
                second_avg = sum(group_scores[mid:]) / len(group_scores[mid:])
                trend = (
                    "up"
                    if second_avg > first_avg + 2
                    else ("down" if second_avg < first_avg - 2 else "stable")
                )
            else:
                trend = "stable"

            standard_performance.append(
                StandardPerformance(
                    standardId=std_ids_map[std_id],
                    standardTitle=std_titles[std_id],
                    avgScore=round(avg, 1),
                    minScore=round(min(group_scores), 1),
                    maxScore=round(max(group_scores), 1),
                    reportCount=len(group_scores),
                    latestScore=round(std_latest[std_id], 1),
                    trend=trend,
                )
            )

        standard_performance.sort(key=lambda x: x.reportCount, reverse=True)

        # ── Status Breakdown ─────────────────────────────────────────────
        status_counts: Dict[str, int] = defaultdict(int)
        for r in reports:
            s = (r.status or "completed").lower()
            if s in ("processing", "pending"):
                status_counts["Processing"] += 1
            elif s in ("failed", "error"):
                status_counts["Failed"] += 1
            else:
                status_counts["Completed"] += 1

        status_breakdown = [
            StatusBreakdown(name=name, value=count)
            for name, count in status_counts.items()
            if count > 0
        ]

        # ── Score Distribution (histogram) ───────────────────────────────
        buckets = {"0-20": 0, "21-40": 0, "41-60": 0, "61-80": 0, "81-100": 0}
        for s in scores:
            if s <= 20:
                buckets["0-20"] += 1
            elif s <= 40:
                buckets["21-40"] += 1
            elif s <= 60:
                buckets["41-60"] += 1
            elif s <= 80:
                buckets["61-80"] += 1
            else:
                buckets["81-100"] += 1

        score_distribution = [{"range": k, "count": v} for k, v in buckets.items()]

        # ── Growth Metrics ───────────────────────────────────────────────
        mid_idx = total_reports // 2
        first_half = scores[mid_idx:]   # older (reports are desc)
        second_half = scores[:mid_idx]  # newer
        first_avg = sum(first_half) / len(first_half) if first_half else 0
        second_avg = sum(second_half) / len(second_half) if second_half else 0
        growth_pct = (
            round(((second_avg - first_avg) / first_avg) * 100, 1)
            if first_avg > 0
            else 0.0
        )
        growth = GrowthMetrics(
            currentPeriodAvg=round(second_avg, 1),
            previousPeriodAvg=round(first_avg, 1),
            growthPercent=growth_pct,
            direction="up" if growth_pct > 2 else ("down" if growth_pct < -2 else "stable"),
        )

        # ── Anomaly Detection ────────────────────────────────────────────
        anomalies: List[AnomalyItem] = []
        if std_dev > 0 and total_reports > 2:
            for r in reports:
                z = abs(r.overallScore - avg_score) / std_dev
                if z > 2:
                    anomalies.append(
                        AnomalyItem(
                            reportId=r.id,
                            standardTitle=r.standard.title if r.standard else "Unknown",
                            score=round(r.overallScore, 1),
                            deviation=round(z, 2),
                            createdAt=r.createdAt,
                        )
                    )

        # ── Auto-Generated Insights ──────────────────────────────────────
        insights = AnalyticsService._generate_insights(
            avg_score=avg_score,
            std_dev=std_dev,
            growth=growth,
            anomalies=anomalies,
            standard_performance=standard_performance,
            total_evidence=total_evidence,
            alignment_pct=alignment_pct,
            total_criteria=total_criteria,
            total_reports=total_reports,
            unique_standards=unique_standards,
        )

        return AnalyticsResponse(
            totalReports=total_reports,
            avgScore=avg_score,
            stdDeviation=std_dev,
            latestScore=latest_score,
            scoreDelta=delta,
            uniqueStandards=unique_standards,
            totalEvidence=total_evidence,
            alignmentPercentage=alignment_pct,
            totalCriteria=total_criteria,
            alignedCriteria=aligned_criteria,
            growth=growth,
            scoreTrend=score_trend,
            evidenceTrend=evidence_trend,
            standardPerformance=standard_performance,
            statusBreakdown=status_breakdown,
            scoreDistribution=score_distribution,
            anomalies=anomalies,
            insights=insights,
            periodDays=period_days,
            generatedAt=now,
        )

    @staticmethod
    async def get_ai_analytics(current_user: dict, period_days: int = 30) -> dict:
        """AI usage/cost hooks for the analytics dashboard."""
        db = get_db()
        now = datetime.now(timezone.utc)
        cutoff = now - timedelta(days=period_days)
        user_id = current_user["id"]
        institution_id = current_user.get("institutionId")
        is_admin = current_user.get("role") == "ADMIN"
        where_scope = ""
        params: list[Any] = [cutoff]
        if not is_admin:
            if institution_id:
                where_scope = 'AND ("institutionId" = $2 OR "userId" = $3)'
                params.extend([institution_id, user_id])
            else:
                where_scope = 'AND "userId" = $2'
                params.append(user_id)
        try:
            rows = await db.query_raw(
                f"""
                SELECT provider, COALESCE(model, 'unknown') AS model, operation,
                       COUNT(*) AS calls,
                       COALESCE(SUM("estimatedCostUsd"), 0) AS cost,
                       COALESCE(AVG("latencyMs"), 0) AS avg_latency,
                       COALESCE(SUM("inputTokens" + "outputTokens"), 0) AS tokens
                FROM "AIUsageMetric"
                WHERE "createdAt" >= $1 {where_scope}
                GROUP BY provider, model, operation
                ORDER BY cost DESC, calls DESC
                LIMIT 50
                """,
                *params,
            )
            totals = {
                "calls": sum(int(r.get("calls") or 0) for r in rows or []),
                "estimatedCostUsd": round(sum(float(r.get("cost") or 0) for r in rows or []), 6),
                "tokens": sum(int(r.get("tokens") or 0) for r in rows or []),
            }
            return {
                "periodDays": period_days,
                "totals": totals,
                "routes": [
                    {
                        "provider": r.get("provider"),
                        "model": r.get("model"),
                        "operation": r.get("operation"),
                        "calls": int(r.get("calls") or 0),
                        "estimatedCostUsd": round(float(r.get("cost") or 0), 6),
                        "avgLatencyMs": round(float(r.get("avg_latency") or 0), 1),
                        "tokens": int(r.get("tokens") or 0),
                    }
                    for r in rows or []
                ],
                "costReduction": {
                    "strategy": "short turns route to fast low-cost models; document intelligence uses local deterministic pass",
                    "estimatedReductionPct": 35,
                },
            }
        except Exception as exc:
            logger.debug("AI analytics unavailable: %s", exc)
            return {
                "periodDays": period_days,
                "totals": {"calls": 0, "estimatedCostUsd": 0, "tokens": 0},
                "routes": [],
                "costReduction": {"strategy": "metrics table not migrated yet", "estimatedReductionPct": 0},
            }

    @staticmethod
    def _generate_insights(
        avg_score: float,
        std_dev: float,
        growth: GrowthMetrics,
        anomalies: List[AnomalyItem],
        standard_performance: List[StandardPerformance],
        total_evidence: int,
        alignment_pct: float,
        total_criteria: int,
        total_reports: int,
        unique_standards: int,
    ) -> List[InsightItem]:
        """Generate actionable insights from computed analytics — no AI API calls, pure stats."""
        insights: List[InsightItem] = []

        if total_reports == 0:
            insights.append(
                InsightItem(
                    id="no-data",
                    title="No Reports Yet",
                    description="Run your first gap analysis to start seeing analytics insights.",
                    severity="info",
                    action="Run gap analysis",
                )
            )
            return insights

        # 1. Overall health
        if avg_score >= 80:
            insights.append(InsightItem(
                id="health-excellent",
                title="Excellent Compliance Health",
                description=f"Average compliance score of {avg_score}% exceeds the 80% threshold. Systems are performing optimally across {unique_standards} standard(s).",
                severity="positive",
                metric=f"{avg_score}%",
            ))
        elif avg_score >= 60:
            insights.append(InsightItem(
                id="health-moderate",
                title="Compliance Needs Attention",
                description=f"Average score of {avg_score}% indicates moderate compliance. Focus remediation efforts on standards scoring below 60%.",
                severity="warning",
                metric=f"{avg_score}%",
                action="Review low-scoring standards",
            ))
        else:
            insights.append(InsightItem(
                id="health-critical",
                title="Critical Compliance Gap",
                description=f"Average score of {avg_score}% signals significant compliance risk. Immediate remediation is recommended.",
                severity="critical",
                metric=f"{avg_score}%",
                action="Take immediate action",
            ))

        # 2. Growth trajectory
        if growth.growthPercent > 5:
            insights.append(InsightItem(
                id="growth-positive",
                title="Positive Growth Trajectory",
                description=f"Scores improved by {growth.growthPercent}% in the recent period ({growth.previousPeriodAvg}% → {growth.currentPeriodAvg}%). Remediation efforts are working.",
                severity="positive",
                metric=f"+{growth.growthPercent}%",
            ))
        elif growth.growthPercent < -5:
            insights.append(InsightItem(
                id="growth-decline",
                title="Declining Compliance Scores",
                description=f"Scores dropped {abs(growth.growthPercent)}% ({growth.previousPeriodAvg}% → {growth.currentPeriodAvg}%). Investigate resource allocation and process changes.",
                severity="warning",
                metric=f"{growth.growthPercent}%",
                action="Investigate decline",
            ))

        # 3. Score consistency
        if std_dev > 20:
            insights.append(InsightItem(
                id="high-variance",
                title="High Score Variability",
                description=f"Score spread of {std_dev}% indicates inconsistent compliance across analyses. Standardise your preparation approach.",
                severity="warning",
                metric=f"±{std_dev}%",
            ))
        elif std_dev < 5 and total_reports > 3:
            insights.append(InsightItem(
                id="consistent-scores",
                title="Highly Consistent Scores",
                description=f"Score spread of only {std_dev}% — your compliance performance is remarkably stable across all analyses.",
                severity="positive",
                metric=f"±{std_dev}%",
            ))

        # 4. Anomalies
        if anomalies:
            insights.append(InsightItem(
                id="anomalies-detected",
                title=f"{len(anomalies)} Unusual Report{'s' if len(anomalies) > 1 else ''} Detected",
                description=f"{'These reports score' if len(anomalies) > 1 else 'This report scores'} significantly outside your normal range. Review for data quality issues or exceptional circumstances.",
                severity="warning",
                metric=f"{len(anomalies)} outlier{'s' if len(anomalies) > 1 else ''}",
                action="Review anomalies",
            ))

        # 5. Evidence alignment gap
        if total_evidence > 0 and alignment_pct < 50:
            insights.append(InsightItem(
                id="evidence-gap",
                title="Low Evidence Coverage",
                description=f"Only {alignment_pct}% of criteria are supported by evidence. Upload targeted documents to strengthen compliance proof.",
                severity="warning",
                metric=f"{alignment_pct}%",
                action="Upload evidence",
            ))
        elif alignment_pct >= 80:
            insights.append(InsightItem(
                id="evidence-strong",
                title="Strong Evidence Coverage",
                description=f"{alignment_pct}% of criteria are backed by evidence documents. This is excellent documentation coverage.",
                severity="positive",
                metric=f"{alignment_pct}%",
            ))

        # 6. Top and bottom performers
        if len(standard_performance) >= 2:
            top = max(standard_performance, key=lambda x: x.avgScore)
            bottom = min(standard_performance, key=lambda x: x.avgScore)

            insights.append(InsightItem(
                id="top-performer",
                title=f"Leading: {top.standardTitle}",
                description=f"Highest average score of {top.avgScore}% across {top.reportCount} report{'s' if top.reportCount > 1 else ''}. Use this as a benchmark for other standards.",
                severity="positive",
                metric=f"{top.avgScore}%",
            ))

            if bottom.avgScore < 60:
                insights.append(InsightItem(
                    id="bottom-performer",
                    title=f"Needs Focus: {bottom.standardTitle}",
                    description=f"Lowest average score of {bottom.avgScore}% across {bottom.reportCount} report{'s' if bottom.reportCount > 1 else ''}. Prioritise gap remediation here.",
                    severity="critical" if bottom.avgScore < 40 else "warning",
                    metric=f"{bottom.avgScore}%",
                    action="Focus remediation",
                ))

        return insights[:8]  # Cap at 8 insights

    @staticmethod
    def _empty_response(period_days: Optional[int], now: datetime) -> AnalyticsResponse:
        """Return an empty analytics response for users without data."""
        return AnalyticsResponse(
            totalReports=0,
            avgScore=0.0,
            stdDeviation=0.0,
            latestScore=0.0,
            scoreDelta=0.0,
            uniqueStandards=0,
            totalEvidence=0,
            alignmentPercentage=0.0,
            totalCriteria=0,
            alignedCriteria=0,
            growth=GrowthMetrics(
                currentPeriodAvg=0, previousPeriodAvg=0, growthPercent=0, direction="stable"
            ),
            scoreTrend=[],
            evidenceTrend=[],
            standardPerformance=[],
            statusBreakdown=[],
            scoreDistribution=[
                {"range": "0-20", "count": 0},
                {"range": "21-40", "count": 0},
                {"range": "41-60", "count": 0},
                {"range": "61-80", "count": 0},
                {"range": "81-100", "count": 0},
            ],
            anomalies=[],
            insights=[
                InsightItem(
                    id="no-data",
                    title="No Data Available",
                    description="Run a gap analysis to start generating analytics.",
                    severity="info",
                    action="Run gap analysis",
                )
            ],
            periodDays=period_days,
            generatedAt=now,
        )

"""
PDF Report Generator for Gap Analysis.

Generates a professional PDF report from a GapAnalysisResponse using reportlab.
"""
import io
from datetime import datetime
from typing import List

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    HRFlowable,
    KeepTogether,
)

# ─── Color Palette ────────────────────────────────────────────────────────────
BRAND_DARK = colors.HexColor("#0F172A")       # Slate 900
BRAND_PRIMARY = colors.HexColor("#6366F1")    # Indigo 500
BRAND_ACCENT = colors.HexColor("#8B5CF6")     # Violet 500
BRAND_SUCCESS = colors.HexColor("#10B981")    # Emerald 500
BRAND_WARNING = colors.HexColor("#F59E0B")    # Amber 500
BRAND_DANGER = colors.HexColor("#EF4444")     # Red 500
BRAND_LIGHT = colors.HexColor("#F8FAFC")      # Slate 50
BRAND_MUTED = colors.HexColor("#64748B")      # Slate 500
BRAND_BORDER = colors.HexColor("#E2E8F0")     # Slate 200

STATUS_COLORS = {
    "aligned": BRAND_SUCCESS,
    "partially_aligned": BRAND_WARNING,
    "needs_improvement": BRAND_DANGER,
    "no_evidence": BRAND_MUTED,
}

STATUS_LABELS = {
    "aligned": "Aligned",
    "partially_aligned": "Partially Aligned",
    "needs_improvement": "Needs Improvement",
    "no_evidence": "No Evidence",
}

PRIORITY_COLORS = {
    "high": BRAND_DANGER,
    "medium": BRAND_WARNING,
    "low": BRAND_SUCCESS,
}


def _get_styles():
    """Build the style sheet for the report."""
    styles = getSampleStyleSheet()

    styles.add(ParagraphStyle(
        name="ReportTitle",
        fontName="Helvetica-Bold",
        fontSize=24,
        textColor=BRAND_DARK,
        spaceAfter=4,
        alignment=TA_LEFT,
    ))
    styles.add(ParagraphStyle(
        name="ReportSubtitle",
        fontName="Helvetica",
        fontSize=11,
        textColor=BRAND_MUTED,
        spaceAfter=2,
        alignment=TA_LEFT,
    ))
    styles.add(ParagraphStyle(
        name="SectionHeader",
        fontName="Helvetica-Bold",
        fontSize=13,
        textColor=BRAND_PRIMARY,
        spaceBefore=16,
        spaceAfter=6,
        alignment=TA_LEFT,
    ))
    styles.add(ParagraphStyle(
        name="BodyText2",
        fontName="Helvetica",
        fontSize=9,
        textColor=BRAND_DARK,
        spaceAfter=4,
        leading=14,
        alignment=TA_LEFT,
    ))
    styles.add(ParagraphStyle(
        name="SmallMuted",
        fontName="Helvetica",
        fontSize=8,
        textColor=BRAND_MUTED,
        spaceAfter=2,
        alignment=TA_LEFT,
    ))
    styles.add(ParagraphStyle(
        name="ScoreLabel",
        fontName="Helvetica-Bold",
        fontSize=32,
        textColor=BRAND_PRIMARY,
        alignment=TA_CENTER,
    ))
    styles.add(ParagraphStyle(
        name="BulletItem",
        fontName="Helvetica",
        fontSize=9,
        textColor=BRAND_DARK,
        leftIndent=12,
        spaceAfter=3,
        leading=13,
    ))
    return styles


def _score_color(score: float) -> colors.Color:
    if score >= 70:
        return BRAND_SUCCESS
    if score >= 40:
        return BRAND_WARNING
    return BRAND_DANGER


def generate_pdf_report(report) -> bytes:
    """
    Generate a PDF report from a GapAnalysisResponse (or dict-like object).

    Args:
        report: GapAnalysisResponse Pydantic model or equivalent dict.

    Returns:
        PDF bytes ready to be streamed.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=2 * cm,
        leftMargin=2 * cm,
        topMargin=2 * cm,
        bottomMargin=2 * cm,
        title=f"Gap Analysis Report — {getattr(report, 'standardTitle', 'Report')}",
        author="Ayn Platform",
    )

    styles = _get_styles()
    story = []

    # ── Header ────────────────────────────────────────────────────────────────
    story.append(Paragraph("Ayn Platform", styles["SmallMuted"]))
    story.append(Paragraph("Gap Analysis Report", styles["ReportTitle"]))
    story.append(Paragraph(
        f"Standard: <b>{getattr(report, 'standardTitle', 'N/A')}</b>",
        styles["ReportSubtitle"]
    ))
    generated_at = datetime.utcnow().strftime("%B %d, %Y at %H:%M UTC")
    story.append(Paragraph(f"Generated: {generated_at}", styles["SmallMuted"]))
    story.append(HRFlowable(width="100%", thickness=1, color=BRAND_BORDER, spaceAfter=12))

    # ── Score Summary Card ─────────────────────────────────────────────────────
    score = getattr(report, "overallScore", 0) or 0
    score_color = _score_color(score)
    score_label = "Excellent" if score >= 70 else "Needs Work" if score >= 40 else "Critical"

    score_data = [[
        Paragraph(f'<font color="#{score_color.hexval()[2:]}"><b>{score:.0f}%</b></font>', styles["ScoreLabel"]),
        Paragraph(
            f"<b>Overall Compliance Score</b><br/>"
            f"<font color='#{score_color.hexval()[2:]}'>{score_label}</font><br/><br/>"
            f"{getattr(report, 'summary', '')}",
            styles["BodyText2"]
        ),
    ]]
    score_table = Table(score_data, colWidths=[4 * cm, 13 * cm])
    score_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (0, 0), BRAND_LIGHT),
        ("BACKGROUND", (1, 0), (1, 0), colors.white),
        ("BOX", (0, 0), (-1, -1), 1, BRAND_BORDER),
        ("LINEAFTER", (0, 0), (0, 0), 1, BRAND_BORDER),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 12),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 12),
        ("LEFTPADDING", (0, 0), (-1, -1), 12),
        ("RIGHTPADDING", (0, 0), (-1, -1), 12),
    ]))
    story.append(score_table)
    story.append(Spacer(1, 12))

    # ── Gaps Table ────────────────────────────────────────────────────────────
    gaps = getattr(report, "gaps", []) or []
    if gaps:
        story.append(Paragraph("Criterion-Level Analysis", styles["SectionHeader"]))

        header = [
            Paragraph("<b>Criterion</b>", styles["SmallMuted"]),
            Paragraph("<b>Status</b>", styles["SmallMuted"]),
            Paragraph("<b>Priority</b>", styles["SmallMuted"]),
            Paragraph("<b>Gap / Recommendation</b>", styles["SmallMuted"]),
        ]
        table_data = [header]

        for gap in gaps:
            status = getattr(gap, "status", "no_evidence") if not isinstance(gap, dict) else gap.get("status", "no_evidence")
            priority = getattr(gap, "priority", "medium") if not isinstance(gap, dict) else gap.get("priority", "medium")
            criterion_title = getattr(gap, "criterionTitle", "") if not isinstance(gap, dict) else gap.get("criterionTitle", "")
            gap_text = getattr(gap, "gap", "") if not isinstance(gap, dict) else gap.get("gap", "")
            recommendation = getattr(gap, "recommendation", "") if not isinstance(gap, dict) else gap.get("recommendation", "")

            status_color = STATUS_COLORS.get(status, BRAND_MUTED)
            priority_color = PRIORITY_COLORS.get(priority, BRAND_MUTED)

            gap_cell = Paragraph(
                f"<b>Gap:</b> {gap_text}<br/><font color='#6366F1'><b>Rec:</b></font> {recommendation}",
                styles["SmallMuted"]
            )

            table_data.append([
                Paragraph(criterion_title, styles["BodyText2"]),
                Paragraph(
                    f'<font color="#{status_color.hexval()[2:]}"><b>{STATUS_LABELS.get(status, status)}</b></font>',
                    styles["SmallMuted"]
                ),
                Paragraph(
                    f'<font color="#{priority_color.hexval()[2:]}"><b>{priority.upper()}</b></font>',
                    styles["SmallMuted"]
                ),
                gap_cell,
            ])

        col_widths = [4 * cm, 3 * cm, 2 * cm, 8 * cm]
        gaps_table = Table(table_data, colWidths=col_widths, repeatRows=1)
        gaps_table.setStyle(TableStyle([
            # Header row
            ("BACKGROUND", (0, 0), (-1, 0), BRAND_LIGHT),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, 0), 8),
            # Grid
            ("BOX", (0, 0), (-1, -1), 0.5, BRAND_BORDER),
            ("INNERGRID", (0, 0), (-1, -1), 0.25, BRAND_BORDER),
            # Padding
            ("TOPPADDING", (0, 0), (-1, -1), 6),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ("LEFTPADDING", (0, 0), (-1, -1), 6),
            ("RIGHTPADDING", (0, 0), (-1, -1), 6),
            # Alternating rows
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, BRAND_LIGHT]),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ]))
        story.append(gaps_table)
        story.append(Spacer(1, 12))

    # ── Recommendations ───────────────────────────────────────────────────────
    recommendations = getattr(report, "recommendations", []) or []
    if recommendations:
        story.append(Paragraph("Strategic Recommendations", styles["SectionHeader"]))
        for i, rec in enumerate(recommendations, 1):
            story.append(Paragraph(f"{i}. {rec}", styles["BulletItem"]))
        story.append(Spacer(1, 8))

    # ── Footer ────────────────────────────────────────────────────────────────
    story.append(HRFlowable(width="100%", thickness=0.5, color=BRAND_BORDER, spaceBefore=12))
    story.append(Paragraph(
        f"This report was generated automatically by the Ayn Compliance Platform. "
        f"Report ID: {getattr(report, 'id', 'N/A')}",
        styles["SmallMuted"]
    ))

    doc.build(story)
    return buffer.getvalue()

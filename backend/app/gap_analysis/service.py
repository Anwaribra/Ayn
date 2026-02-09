"""Gap analysis AI service - generates structured gap reports using Gemini."""
import asyncio
import json
import logging
from typing import List, Dict, Any, Optional

from app.ai.service import get_gemini_client, SYSTEM_PROMPT, USE_NEW_API

if USE_NEW_API:
    from google.genai import types as genai_types

logger = logging.getLogger(__name__)


GAP_ANALYSIS_PROMPT = """You are performing a detailed gap analysis for an educational institution.

Analyze the institution's data against the standard: **{standard_title}**

CRITERIA ({criteria_count} total):
{criteria_text}

ASSESSMENT ANSWERS:
{answers_text}

EVIDENCE LINKED:
{evidence_text}

─────────────────────────────────────────────────
INSTRUCTIONS:
─────────────────────────────────────────────────
For EACH criterion listed above, determine its compliance status and provide analysis.

Return your response as valid JSON with this exact structure (no markdown fences, just raw JSON):
{{
  "overallScore": <number 0-100 representing overall compliance percentage>,
  "summary": "<executive summary of the gap analysis in 3-5 sentences>",
  "gaps": [
    {{
      "criterionId": "<criterion id>",
      "criterionTitle": "<criterion title>",
      "status": "<one of: met, partially_met, not_met, no_evidence>",
      "currentState": "<what the institution currently has for this criterion>",
      "gap": "<what is missing or needs improvement>",
      "recommendation": "<specific, actionable recommendation>",
      "priority": "<one of: high, medium, low>"
    }}
  ],
  "recommendations": [
    "<top-level recommendation 1>",
    "<top-level recommendation 2>",
    "<top-level recommendation 3>"
  ]
}}

Rules:
- Status "met" = institution fully satisfies the criterion
- Status "partially_met" = some evidence exists but incomplete
- Status "not_met" = evidence exists but doesn't meet the criterion
- Status "no_evidence" = no evidence or assessment answers for this criterion
- Priority should reflect how critical the gap is for accreditation
- Overall score should be calculated as: (met*100 + partially_met*50) / total_criteria
- Recommendations should be specific and actionable, referencing standard clauses
- Return ONLY the JSON, no additional text before or after
"""


def _format_criteria(criteria: list) -> str:
    """Format criteria list for the prompt."""
    if not criteria:
        return "No criteria defined for this standard."
    lines = []
    for i, c in enumerate(criteria, 1):
        desc = c.description or "No description"
        lines.append(f"  {i}. [{c.id}] {c.title}: {desc}")
    return "\n".join(lines)


def _format_answers(answers: list) -> str:
    """Format assessment answers for the prompt."""
    if not answers:
        return "No assessment answers available."
    lines = []
    for a in answers:
        answer_text = a.answer or "No answer provided"
        comment = f" | Reviewer comment: {a.reviewerComment}" if a.reviewerComment else ""
        lines.append(f"  - Criterion [{a.criterionId}]: {answer_text}{comment}")
    return "\n".join(lines)


def _format_evidence(evidence: list) -> str:
    """Format evidence list for the prompt."""
    if not evidence:
        return "No evidence files uploaded."
    lines = []
    for e in evidence:
        criterion_info = f" (linked to criterion {e.criterionId})" if e.criterionId else " (not linked to any criterion)"
        lines.append(f"  - File: {e.fileUrl}{criterion_info}")
    return "\n".join(lines)


def _parse_gap_response(response_text: str) -> dict:
    """Parse the AI response into structured gap analysis data."""
    # Strip any markdown code fences if present
    text = response_text.strip()
    if text.startswith("```"):
        # Remove opening fence
        first_newline = text.index("\n")
        text = text[first_newline + 1:]
    if text.endswith("```"):
        text = text[:-3].strip()

    try:
        data = json.loads(text)
    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse gap analysis JSON: {e}")
        logger.error(f"Raw response: {text[:500]}")
        # Return a fallback structure
        return {
            "overallScore": 0,
            "summary": "Failed to generate gap analysis. The AI response could not be parsed. Please try again.",
            "gaps": [],
            "recommendations": ["Please retry the gap analysis generation."]
        }

    # Validate and clean the data
    overall_score = float(data.get("overallScore", 0))
    overall_score = max(0, min(100, overall_score))

    gaps = []
    for gap in data.get("gaps", []):
        status = gap.get("status", "no_evidence")
        if status not in ("met", "partially_met", "not_met", "no_evidence"):
            status = "no_evidence"
        priority = gap.get("priority", "medium")
        if priority not in ("high", "medium", "low"):
            priority = "medium"

        gaps.append({
            "criterionId": gap.get("criterionId", ""),
            "criterionTitle": gap.get("criterionTitle", "Unknown"),
            "status": status,
            "currentState": gap.get("currentState", ""),
            "gap": gap.get("gap", ""),
            "recommendation": gap.get("recommendation", ""),
            "priority": priority,
        })

    return {
        "overallScore": overall_score,
        "summary": data.get("summary", ""),
        "gaps": gaps,
        "recommendations": data.get("recommendations", []),
    }


async def generate_gap_analysis(
    standard: Any,
    criteria: list,
    answers: list,
    evidence: list,
) -> dict:
    """
    Generate a gap analysis using Gemini AI.

    Args:
        standard: Standard ORM object with title, description
        criteria: List of Criterion ORM objects
        answers: List of AssessmentAnswer ORM objects
        evidence: List of Evidence ORM objects

    Returns:
        Parsed gap analysis dict with overallScore, summary, gaps, recommendations
    """
    prompt = GAP_ANALYSIS_PROMPT.format(
        standard_title=standard.title,
        criteria_count=len(criteria),
        criteria_text=_format_criteria(criteria),
        answers_text=_format_answers(answers),
        evidence_text=_format_evidence(evidence),
    )

    client = get_gemini_client()

    def _sync_generate():
        if USE_NEW_API:
            response = client.client.models.generate_content(
                model=client.model_name,
                config=genai_types.GenerateContentConfig(
                    system_instruction=SYSTEM_PROMPT,
                    response_mime_type="application/json",
                ),
                contents=prompt,
            )
            return response.text
        else:
            full_prompt = f"{SYSTEM_PROMPT}\n\n---\n\n{prompt}"
            response = client.model.generate_content(full_prompt)
            return response.text

    try:
        result_text = await asyncio.to_thread(_sync_generate)
        return _parse_gap_response(result_text)

    except Exception as e:
        logger.error(f"Error generating gap analysis: {e}")
        raise Exception(f"Failed to generate gap analysis: {str(e)}")

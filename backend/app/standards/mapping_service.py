import asyncio
import json
import logging
import re
from typing import List, Optional
from datetime import datetime, timedelta, timezone
from app.core.db import get_db

from app.ai.service import get_gemini_client, ISO_21001_KNOWLEDGE, NAQAAE_KNOWLEDGE
from prisma.models import Standard, Criterion, Evidence, CriteriaMapping, GapAnalysis

logger = logging.getLogger(__name__)

async def parse_knowledge_to_criteria(knowledge_text: str) -> List[dict]:
    """Parse knowledge text into criteria dictionaries. Simple extraction based on clauses/domains."""
    criteria = []
    # simple extraction pattern based on knowledge structure
    # For ISO: "Clause 4: Context of the organization"
    # For NAQAAE: "1. Institutional Capacity"
    
    lines = knowledge_text.split('\n')
    for line in lines:
        line = line.strip()
        if not line:
            continue
        
        # Look for ISO patterns "Clause X: Title"
        iso_match = re.search(r'Clause\s+(\d+):\s+(.*)', line)
        if iso_match:
            criteria.append({
                "title": iso_match.group(2).strip(),
                "code": f"Clause {iso_match.group(1)}",
                "description": f"Standard requirement for Clause {iso_match.group(1)}: {iso_match.group(2).strip()}"
            })
            continue
        
        # Look for NAQAAE numbered domains "1. Title"
        naqaae_match = re.search(r'^(\d+)\.\s+(.*)', line)
        if naqaae_match and "ISO" not in line and "NAQAAE" not in line:
            title_parts = naqaae_match.group(2).split('(')
            title = title_parts[0].strip()
            desc = ""
            if len(title_parts) > 1:
                desc = f"Includes: {title_parts[1].replace(')', '')}"
            
            criteria.append({
                "title": title,
                "code": naqaae_match.group(1),
                "description": desc or f"Requirement for {title}"
            })

    return criteria

async def analyze_criterion_with_retry(gemini_client, prompt: str, max_retries: int = 3) -> dict:
    """Call Gemini with exponential backoff."""
    base_wait = 2
    for attempt in range(max_retries + 1):
        try:
            # We enforce JSON response from Gemini
            response_text = await gemini_client.generate_text(
                prompt + "\n\nRespond ONLY with valid JSON. Do not include markdown formatting like ```json"
            )
            # Remove markdown if present
            response_text = response_text.replace("```json", "").replace("```", "").strip()
            return json.loads(response_text)
        except Exception as e:
            if attempt < max_retries:
                wait_time = base_wait * (2 ** attempt)
                logger.warning(f"Rate limit or error hit. Retrying in {wait_time}s... (Attempt {attempt+1}/{max_retries}): {e}")
                await asyncio.sleep(wait_time)
            else:
                logger.error(f"Failed to analyze criterion after {max_retries} retries: {e}")
                return {
                    "status": "gap",
                    "confidence_score": 0.0,
                    "ai_reasoning": "Failed to analyze due to AI service errors.",
                    "best_evidence_id": None
                }
                
async def seed_standard_criteria(db, standard) -> list:
    """Seeds criteria for a standard from predefined knowledge if it has none."""
    knowledge_text = ""
    if "ISO" in (standard.title or "") and "21001" in (standard.title or ""):
        knowledge_text = ISO_21001_KNOWLEDGE
    elif "NAQAAE" in (standard.title or "") or "NCAAA" in (standard.title or ""):
        knowledge_text = NAQAAE_KNOWLEDGE
    else:
        knowledge_text = ISO_9001_KNOWLEDGE
    
    parsed_criteria = await parse_knowledge_to_criteria(knowledge_text)
    criteria = []
    
    for c_data in parsed_criteria:
        new_criterion = await db.criterion.create(
            data={
                "standardId": standard.id,
                "title": f"[{c_data['code']}] {c_data['title']}",
                "description": c_data['description']
            }
        )
        criteria.append(new_criterion)
        
    return criteria
                
async def perform_batch_criteria_analysis(openrouter_client, criteria, evidence_text: str, standard_title: str) -> list:
    """Evaluate ALL criteria against evidence in a single OpenRouter API call."""
    
    criteria_list_text = ""
    for idx, c in enumerate(criteria, 1):
        code = c.title.split(']')[0].replace('[', '') if '[' in c.title else c.title[:10]
        title = c.title.split(']')[1].strip() if ']' in c.title else c.title
        criteria_list_text += f"{idx}. {c.id} | {code} | {title} | {c.description or 'No description'}\n"
        
    prompt = f"""You are a compliance expert. Evaluate ALL criteria below against the available evidence in ONE response.

STANDARD: {standard_title}

CRITERIA:
{criteria_list_text}

EVIDENCE AVAILABLE:
{evidence_text}

For EACH criterion, evaluate if the available evidence satisfies it.
Respond with ONLY a valid JSON array exactly matching this structure:
[
  {{
    "criterion_id": "exact-uuid-here",
    "status": "met" | "partial" | "gap",
    "confidence_score": 0.0 to 1.0,
    "ai_reasoning": "one sentence explanation",
    "best_evidence_id": "uuid or null"
  }}
]
Return ONLY a valid JSON array, no markdown formatting like ```json.
"""
    
    # We call OpenRouter directly
    max_retries = 3
    base_wait = 2
    for attempt in range(max_retries + 1):
        try:
            # We call the OpenRouter internal method via the generic _call mapping or directly via generate_text if available.
            # Usually OpenRouterClient._call expects messages and system_prompt. We can construct it.
            if hasattr(openrouter_client, "_call"):
                response_text = await openrouter_client._call(
                    messages=[{"role": "user", "content": prompt}],
                    system_prompt="You are an expert compliance engine. You return strictly RAW valid JSON arrays without markdown wrappers."
                )
            else:
                response_text = await openrouter_client.generate_text(prompt)
                
            response_text = response_text.replace("```json", "").replace("```", "").strip()
            return json.loads(response_text)
            
        except Exception as e:
            if attempt < max_retries:
                wait_time = base_wait * (2 ** attempt)
                logger.warning(f"Batch analysis rate limit/error hit. Retrying in {wait_time}s... (Attempt {attempt+1}): {e}")
                await asyncio.sleep(wait_time)
            else:
                logger.error(f"Failed to batch analyze criteria after {max_retries} retries: {e}")
                return []

async def analyze_standard_criteria(standard_id: str, institution_id: str, evidence_ids: Optional[List[str]] = None, force_reanalyze: bool = False):
    """Background task to analyze standard criteria against evidence."""
    logger.info(f"Starting standard criteria analysis for standard {standard_id} and institution {institution_id}")
    
    # We create a new DB session for the background task since it runs asynchronously
    db = get_db()
    for _ in [1]:
        try:
            # 1. Fetch standard + all its criteria
            standard = await db.standard.find_unique(
                where={"id": standard_id},
                include={"criteria": True}
            )
            
            if not standard:
                logger.error(f"Standard {standard_id} not found")
                return

            criteria = standard.criteria or []

            # 2. If criteria count == 0, seed from knowledge constants
            if len(criteria) == 0:
                logger.info(f"Criteria count is 0 for standard {standard_id}. Seeding...")
                criteria = await seed_standard_criteria(db, standard)
                    
            if not criteria:
                logger.warning(f"No criteria could be seeded or found for standard {standard_id}")
                return

            # 3. Cache Check (Optimization 3)
            # Check if mappings already exist and are less than 24 hours old
            if force_reanalyze:
                logger.info(f"Force re-analyze requested for standard {standard_id}")
            else:
                existing_mappings = await db.criteriamapping.find_many(
                    where={
                        "standardId": standard_id,
                        "institutionId": institution_id
                    }
                )
                
                if existing_mappings:
                    # Find most recent date manually to avoid DB sort complexities
                    most_recent = max([m.updatedAt for m in existing_mappings if m.updatedAt] or [m.createdAt for m in existing_mappings])
                    
                    # Check if it was updated within the last 24 hours
                    now_utc = datetime.now(timezone.utc)
                    if most_recent.tzinfo is None:
                        most_recent = most_recent.replace(tzinfo=timezone.utc)
                        
                    if (now_utc - most_recent) < timedelta(hours=24):
                        logger.info(f"Using cached standard criteria mappings for {standard_id} (Age: {now_utc - most_recent}). Skipping AI.")
                        return existing_mappings

            # 4. Fetch all evidence for this institution
            institution_users = await db.user.find_many(where={"institutionId": institution_id})
            user_ids = [u.id for u in institution_users]
            
            # Evidence belongs to users or ownerId
            where_clause = {
                "OR": [
                    {"ownerId": institution_id},
                    {"uploadedById": {"in": user_ids}}
                ]
            }
            if evidence_ids is not None:
                where_clause["id"] = {"in": evidence_ids}
                
            evidence_records = await db.evidence.find_many(where=where_clause)

            evidence_context = []
            for ev in evidence_records:
                evidence_context.append(
                    f"- ID: {ev.id}\n  Title: {ev.title or ev.originalFilename}\n  Type: {ev.documentType or 'Unknown'}\n  Summary: {ev.summary or 'No summary'}"
                )
            
            evidence_text = "\n".join(evidence_context) if evidence_context else "No evidence available."

            # Setup AI client - Specifically extract OpenRouter to save Gemini quota (Optimization 2)
            gemini_client = get_gemini_client()
            openrouter_client = gemini_client.openrouter if hasattr(gemini_client, 'openrouter') and gemini_client.openrouter else gemini_client

            # Prepare for fresh mappings (Delete old ones)
            await db.criteriamapping.delete_many(
                where={
                    "standardId": standard_id,
                    "institutionId": institution_id
                }
            )

            # 5. Analyze all criteria in ONE batch call (Optimization 1)
            total_criteria = len(criteria)
            mappings_to_create = []
            
            logger.info(f"Running ONE batch analysis for {total_criteria} criteria using OpenRouter.")
            batch_result_array = await perform_batch_criteria_analysis(openrouter_client, criteria, evidence_text, standard.title or "Standard")
            
            if not isinstance(batch_result_array, list):
                logger.error("AI did not return a valid list for batch analysis. Using empty mapping.")
                batch_result_array = []
                
            # Zip results to db objects safely
            valid_evidence_ids = {e.id for e in evidence_records}
            
            for index, criterion in enumerate(criteria):
                # Try to find corresponding result by index or soft mapping since AI might mess up IDs
                result_obj = batch_result_array[index] if index < len(batch_result_array) else {}
                
                best_evidence_id = result_obj.get("best_evidence_id")
                if best_evidence_id and best_evidence_id not in valid_evidence_ids:
                    best_evidence_id = None
                    
                score = result_obj.get("confidence_score")
                try:
                    score = float(score) if score is not None else 0.0
                except:
                    score = 0.0
                    
                mappings_to_create.append({
                    "criterionId": criterion.id,
                    "evidenceId": best_evidence_id,
                    "institutionId": institution_id,
                    "standardId": standard_id,
                    "status": result_obj.get("status", "gap"),
                    "confidenceScore": score,
                    "aiReasoning": result_obj.get("ai_reasoning", "No valid reasoning provided by backend.")
                })

            # 6. Bulk insert mappings
            if mappings_to_create:
                for mapping in mappings_to_create:
                    await db.criteriamapping.create(data=mapping)
                logger.info(f"✅ Saved {len(mappings_to_create)} CriteriaMapping records for standard {standard_id}")
            else:
                logger.error(f"❌ Failed to save mappings: No valid mapping results generated by AI for standard {standard_id}.")

            # 7. Create or update GapAnalysis
            met_count = sum(1 for m in mappings_to_create if m['status'] == 'met')
            overall_score = (met_count / total_criteria) * 100 if total_criteria > 0 else 0
            
            summary = f"Analyzed {total_criteria} criteria. Found {met_count} met, {sum(1 for m in mappings_to_create if m['status'] == 'partial')} partial, and {sum(1 for m in mappings_to_create if m['status'] == 'gap')} gaps."
            
            await db.gapanalysis.create(
                data={
                    "institutionId": institution_id,
                    "standardId": standard_id,
                    "overallScore": overall_score,
                    "summary": summary,
                    "gapsJson": "{}", # simplified
                    "recommendationsJson": "{}" # simplified
                }
            )
            
            logger.info(f"Finished mapping standard {standard_id} for institution {institution_id}")

        except Exception as e:
            logger.error(f"Error during standard criteria analysis: {e}")
            raise
        finally:
            # We don't disconnect the db if it's the global instance, the session manager handles it
            pass

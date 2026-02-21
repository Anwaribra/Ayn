import asyncio
import json
import logging
import re
from typing import List, Optional

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

async def analyze_standard_criteria(standard_id: str, institution_id: str):
    """Background task to analyze standard criteria against evidence."""
    logger.info(f"Starting standard criteria analysis for standard {standard_id} and institution {institution_id}")
    
    # We create a new DB session for the background task since it runs asynchronously
    async for db_instance in get_db():
        db = db_instance
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
                knowledge_text = ""
                if "ISO" in (standard.title or "") and "21001" in (standard.title or ""):
                    knowledge_text = ISO_21001_KNOWLEDGE
                elif "NAQAAE" in (standard.title or "") or "NCAAA" in (standard.title or ""):
                    knowledge_text = NAQAAE_KNOWLEDGE
                else:
                    # Fallback or general
                    knowledge_text = ISO_9001_KNOWLEDGE
                
                parsed_criteria = await parse_knowledge_to_criteria(knowledge_text)
                
                # Insert parsed criteria as rows linked to standard
                for c_data in parsed_criteria:
                    new_criterion = await db.criterion.create(
                        data={
                            "standardId": standard_id,
                            "title": f"[{c_data['code']}] {c_data['title']}",
                            "description": c_data['description']
                        }
                    )
                    criteria.append(new_criterion)
                    
            if not criteria:
                logger.warning(f"No criteria could be seeded or found for standard {standard_id}")
                return

            # 3. Fetch all evidence for this institution
            institution_users = await db.user.find_many(where={"institutionId": institution_id})
            user_ids = [u.id for u in institution_users]
            
            # Evidence belongs to users or ownerId
            evidence_records = await db.evidence.find_many(
                where={
                    "OR": [
                        {"ownerId": institution_id},
                        {"uploadedById": {"in": user_ids}}
                    ]
                }
            )

            evidence_context = []
            for ev in evidence_records:
                evidence_context.append(
                    f"- ID: {ev.id}\n  Title: {ev.title or ev.originalFilename}\n  Type: {ev.documentType or 'Unknown'}\n  Summary: {ev.summary or 'No summary'}"
                )
            
            evidence_text = "\n".join(evidence_context) if evidence_context else "No evidence available."

            # Setup AI client
            gemini_client = get_gemini_client()

            # Prepare for mappings
            await db.criteriamapping.delete_many(
                where={
                    "standardId": standard_id,
                    "institutionId": institution_id
                }
            )

            # 4. Analyze each criterion
            batch_size = 5
            total_criteria = len(criteria)
            mappings_to_create = []
            
            async def process_criterion(criterion, index):
                logger.info(f"Analyzing criterion {index + 1} of {total_criteria}: {criterion.title}")
                
                # The code prompt requires parsing the title for the "code" if not available separately in DB
                code = criterion.title.split(']')[0].replace('[', '') if '[' in criterion.title else criterion.title[:10]
                title = criterion.title.split(']')[1].strip() if ']' in criterion.title else criterion.title
                
                prompt = f"""You are an educational quality compliance expert.
                
CRITERION: {code} - {title}
DESCRIPTION: {criterion.description or 'No specific description provided'}

AVAILABLE EVIDENCE:
{evidence_text}

Evaluate whether the available evidence satisfies this criterion.

Respond ONLY with valid JSON exactly matching this structure:
{{
  "status": "met" | "partial" | "gap",
  "confidence_score": 0.0 to 1.0,
  "ai_reasoning": "1-2 sentence explanation",
  "best_evidence_id": "uuid or null (use exact ID from the list, or null if none)"
}}
"""
                
                result = await analyze_criterion_with_retry(gemini_client, prompt)
                
                best_evidence_id = result.get("best_evidence_id")
                # Validate if evidence id exists
                if best_evidence_id and best_evidence_id not in [e.id for e in evidence_records]:
                    best_evidence_id = None
                    
                confidence_score = float(result.get("confidence_score", 0.0))
                
                return {
                    "criterionId": criterion.id,
                    "evidenceId": best_evidence_id,
                    "institutionId": institution_id,
                    "standardId": standard_id,
                    "status": result.get("status", "gap"),
                    "confidenceScore": confidence_score,
                    "aiReasoning": result.get("ai_reasoning", "No valid response generated.")
                }

            # Gather in batches of 5 to avoid rate limits
            for i in range(0, len(criteria), batch_size):
                batch = criteria[i:i + batch_size]
                batch_tasks = [process_criterion(c, i + j) for j, c in enumerate(batch)]
                batch_results = await asyncio.gather(*batch_tasks)
                mappings_to_create.extend(batch_results)
                
                if i + batch_size < len(criteria):
                    await asyncio.sleep(2) # brief pause between batches just in case

            # 5. Bulk insert mappings
            if mappings_to_create:
                for mapping in mappings_to_create:
                    await db.criteriamapping.create(data=mapping)

            # 6. Create or update GapAnalysis
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
            break

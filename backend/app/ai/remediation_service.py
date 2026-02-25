import logging
from typing import Optional
from app.ai.service import get_gemini_client
from app.core.db import get_db

logger = logging.getLogger(__name__)

async def draft_remediation_document(
    gap_id: str,
    institution_id: str,
    user_id: str,
    custom_instructions: Optional[str] = None
) -> dict:
    """
    Generate a document draft based on a PlatformGap.
    """
    db = get_db()
    
    # 1. Fetch the gap and institution details
    gap = await db.platformgap.find_unique(
        where={"id": gap_id},
        include={"user": True}
    )
    
    if not gap:
        raise ValueError(f"Gap with ID {gap_id} not found.")

    institution = await db.institution.find_unique(
        where={"id": institution_id}
    )
    
    if not institution:
        raise ValueError(f"Institution with ID {institution_id} not found.")

    # 2. Construct the AI Prompt
    title_prompt = f"Policy or Procedure for {gap.standard} - {gap.clause}"
    
    prompt = f"""
    You are an expert Educational Quality Assurance Consultant.
    
    The institution "{institution.name}" has identified a compliance gap.
    
    Gap Details:
    - Standard: {gap.standard}
    - Clause: {gap.clause}
    - Description of Gap: {gap.description}
    - Severity: {gap.severity}
    
    Your task is to draft a comprehensive, professional, and compliant document (Policy, Procedure, or Evidence Template) that will perfectly close this gap.
    
    Requirements for the Document:
    1. It must be written formally, suitable for an official school/university policy manual.
    2. It must explicitly address the requirements of the standard and clause mentioned.
    3. Include placeholders like [Institution Name], [Date], [Responsible Role] where appropriate.
    4. Format the output in clean Markdown.
    5. Do NOT include introductory conversational text (e.g., "Here is your document"). ONLY output the document content itself.
    """
    
    if custom_instructions:
        prompt += f"\n\nAdditional Instructions from the user:\n{custom_instructions}"

    # 3. Call the AI
    ai_client = get_gemini_client()
    try:
        logger.info(f"Generating document draft for gap {gap_id}...")
        draft_content = await ai_client.generate_text(prompt=prompt)
    except Exception as e:
        logger.error(f"AI Generation failed: {e}")
        raise RuntimeError(f"Failed to generate draft: {str(e)}")

    # 4. Save the draft to the database
    draft = await db.documentdraft.create(
        data={
            "institutionId": institution_id,
            "userId": user_id,
            "gapId": gap_id,
            "title": f"Draft: Remediation for {gap.clause}",
            "content": draft_content,
            "status": "draft"
        }
    )
    
    return draft

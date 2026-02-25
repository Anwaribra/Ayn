import logging
from typing import Optional
from app.ai.service import get_gemini_client
from app.rag.service import RagService
from app.core.db import get_db

logger = logging.getLogger(__name__)

async def start_mock_audit(
    institution_id: str,
    user_id: str,
    standard_id: Optional[str] = None
) -> dict:
    """Initialize a mock audit session and generate the first question based on RAG."""
    db = get_db()
    
    # 1. Create the session
    session = await db.mockauditsession.create(
        data={
            "institutionId": institution_id,
            "userId": user_id,
            "standardId": standard_id,
        }
    )
    
    # 2. Gather context using RAG
    # We query the vector database for a general overview of the institution's evidence
    query = "All evidence policies and procedures related to this standard."
    rag_context = ""
    try:
        rag = RagService()
        rag_context = await rag.retrieve_context(query, limit=5)
    except Exception as e:
        logger.warning(f"Failed to fetch RAG context for initial mock audit: {e}")
        rag_context = "No pre-existing documentation could be loaded."

    # 3. Prompt the AI for the opening remark
    prompt_instruction = f"""
    You are an expert, strict, but fair External Auditor for Educational Quality Assurance.
    You are beginning a Mock Audit session with a staff member.
    Start the conversation by introducing yourself and asking the first challenging question based on the documentation provided below.
    If there is no documentation, ask them to explain their quality assurance framework.
    
    Documentation Context:
    {rag_context}
    """
    
    ai_client = get_gemini_client()
    try:
        initial_reply = await ai_client.generate_text(prompt=prompt_instruction)
    except Exception as e:
        logger.error(f"Failed to generate initial AI remark: {e}")
        initial_reply = "Hello. I am the Horus AI Auditor. Let's begin the mock audit. Can you explain your institution's approach to quality management?"

    # 4. Save the AI's opening message
    await db.mockauditmessage.create(
        data={
            "sessionId": session.id,
            "role": "assistant",
            "content": initial_reply
        }
    )
    
    return {"session_id": session.id, "initial_message": initial_reply}


async def submit_mock_audit_message(
    session_id: str,
    content: str
) -> dict:
    """Submit a user message to the mock audit and get the auditor's response."""
    db = get_db()
    
    # 1. Verify session exists
    session = await db.mockauditsession.find_unique(
        where={"id": session_id},
        include={"messages": True}
    )
    if not session:
        raise ValueError(f"Mock Audit Session {session_id} not found.")

    # 2. Save user message
    await db.mockauditmessage.create(
        data={
            "sessionId": session_id,
            "role": "user",
            "content": content
        }
    )
    
    # 3. Gather RAG context based on what the user just said
    rag_context = ""
    try:
        rag = RagService()
        rag_context = await rag.retrieve_context(content, limit=3)
    except Exception as e:
        logger.warning(f"Failed to fetch RAG context for mock audit message: {e}")

    # 4. Build chat history
    history = []
    # Load past messages (limit to last 10 for context window)
    for msg in session.messages[-10:]:
        history.append({"role": msg.role, "content": msg.content})
    
    # Add the current user message
    history.append({"role": "user", "content": content})

    # 5. Get AI Response
    ai_client = get_gemini_client()
    
    system_persona = f"""
    You are still playing the role of the strict Quality Assurance Auditor.
    Evaluate the user's latest response.
    If their response contradicts the Evidence Context provided below, call them out on it professionally.
    If it is satisfactory, move on to the next audit question.
    
    Evidence Context Retrieved during this turn:
    {rag_context}
    """
    
    try:
         # Use the chat method, passing the persona via context
        reply_text = await ai_client.chat(messages=history, context=system_persona)
    except Exception as e:
        logger.error(f"Failed to get AI auditor response: {e}")
        raise RuntimeError(f"Audit generation failed: {e}")

    # 6. Save AI Response
    ai_message = await db.mockauditmessage.create(
        data={
            "sessionId": session_id,
            "role": "assistant",
            "content": reply_text
        }
    )
    
    return {
        "reply": reply_text,
        "message_id": ai_message.id
    }

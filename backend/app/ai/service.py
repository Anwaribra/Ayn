"""AI service with Gemini primary + OpenRouter fallback."""
from app.core.config import settings
import logging
import httpx
import json
from typing import Optional, List, Dict
import os
import asyncio
import time
from fastapi import HTTPException, status

logger = logging.getLogger(__name__)

_GEMINI_COOLDOWN_UNTIL: float = 0.0

def _gemini_rate_limited(err: Exception) -> bool:
    msg = str(err)
    return "RESOURCE_EXHAUSTED" in msg or "429" in msg or "rate limit" in msg.lower()

def _gemini_daily_quota_exhausted(err: Exception) -> bool:
    """Return True when the daily free-tier quota (not just per-minute) is gone."""
    msg = str(err).lower()
    # Match known Gemini quota exhaustion patterns
    if "generate_content_free_tier_requests" in msg and "perday" in msg.lower():
        return True
    if "quota exhausted" in msg or "limit: 0" in msg:
        return True
    return False

def _gemini_model_invalid(err: Exception) -> bool:
    """Return True when the model name is not found — no point retrying."""
    msg = str(err)
    return "NOT_FOUND" in msg or "404" in msg or "is not found for API version" in msg

# Try importing Gemini SDK
GEMINI_AVAILABLE = False
try:
    from google import genai as new_genai
    from google.genai import types as genai_types
    GEMINI_AVAILABLE = True
    USE_NEW_API = True
except ImportError:
    try:
        import google.generativeai as old_genai
        GEMINI_AVAILABLE = True
        USE_NEW_API = False
    except ImportError:
        logger.warning("Gemini SDK not installed. Only OpenRouter will be available.")
        USE_NEW_API = False


# ─── Platform-Aware System Prompt ────────────────────────────────────────────
# ─── Modular System Prompts ──────────────────────────────────────────────────

BASE_SYSTEM_PROMPT = """You are Horus (حورس), the central intelligence of the Ayn Platform (عين).

## 1. ROLE
- You are a Senior Quality Assurance Auditor & Compliance Expert.
- You are not a simple chatbot — you are the operating brain of the entire platform.
- Ayn defaults to an Egypt-first institutional context unless the user or the source material clearly indicates another country.

## 2. FORMAT
- All responses must use Structured Markdown (Tables for gaps, **Bold** for clauses).

## 3. EVIDENCE-FIRST
- You cannot make a claim without citing a specific document from the Evidence Vault.
- Use uploaded files and data as implicit context.
- Always tie your reasoning back to clear evidence.

## 4. REPORTING
- Every report or audit MUST include:
  1. Executive Summary
  2. Severity Mapping (High/Medium/Low)
  3. Actionable Remediation Roadmap

## 5. STYLE
- Professional, surgical precision, no fluff.
- You speak carefully and confidently.
- No forced onboarding or imposed workflows unless the user asks for it.

## Your Permissions & Behavior
- You can read the full platform state at all times.
- Think cross-module (Evidence, Gaps, Dashboard, Archive).
- Everything that happens on the platform is shared context.

## Arabic Names (IMPORTANT)
When writing in Arabic, always use:
- Your name: "حورس" (Horus) — NOT "هورس"
- Platform name: "عين" (Ayn) — NOT "آين"
"""

async def _chunk_text_stream(text: str, chunk_size: int = 24):
    """Yield text in small chunks to simulate streaming when provider doesn't support it."""
    if not text:
        return
    for i in range(0, len(text), chunk_size):
        yield text[i:i + chunk_size]
        await asyncio.sleep(0)


async def transcribe_audio(
    audio_bytes: bytes,
    filename: str,
    mime_type: str,
    language: Optional[str] = None,
) -> str:
    """Transcribe audio via OpenAI speech-to-text."""
    if not settings.OPENAI_API_KEY:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Speech-to-text not configured.")
    model = settings.OPENAI_TRANSCRIBE_MODEL or "gpt-4o-mini-transcribe"
    headers = {"Authorization": f"Bearer {settings.OPENAI_API_KEY}"}
    data = {"model": model}
    if language:
        data["language"] = language
    file_tuple = (filename or "audio.webm", audio_bytes, mime_type or "application/octet-stream")
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            resp = await client.post(
                "https://api.openai.com/v1/audio/transcriptions",
                headers=headers,
                data=data,
                files={"file": file_tuple},
            )
        if resp.status_code == 401:
            logger.error("STT auth failed: %s", resp.text)
            raise HTTPException(status_code=401, detail="Speech-to-text authentication failed.")
        if resp.status_code == 429:
            logger.error("STT quota exceeded: %s", resp.text)
            raise HTTPException(status_code=429, detail="Speech-to-text quota exceeded. Add billing or credits to your OpenAI key.")
        resp.raise_for_status()
        payload = resp.json()
        text = (payload.get("text") or "").strip()
        return text
    except httpx.HTTPStatusError as err:
        logger.error("STT request failed: %s", err.response.text)
        raise HTTPException(status_code=502, detail="Speech-to-text provider error.")
    except HTTPException:
        raise
    except Exception as err:
        logger.error("STT request failed: %s", err, exc_info=True)
        raise HTTPException(status_code=500, detail="Speech-to-text failed.")

ISO_21001_KNOWLEDGE = """
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. ISO 21001:2018 — Educational Organizations Management Systems (EOMS)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Purpose: International standard for management systems in educational organizations.
• Key Clauses:
  - Clause 4: Context of the organization
  - Clause 5: Leadership & Policy
  - Clause 6: Planning & Risk/Opportunities
  - Clause 7: Support & Resources
  - Clause 8: Operations & Delivery
  - Clause 9: Performance Evaluation
  - Clause 10: Improvement
• Social Responsibility: Addresses accessibility, equity, and transparency.
"""

ISO_9001_KNOWLEDGE = """
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
2. ISO 9001:2015 — Quality Management Systems
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Foundation for ISO 21001.
• Seven Quality Management Principles:
  1. Customer Focus
  2. Leadership
  3. Engagement of People
  4. Process Approach
  5. Improvement
  6. Evidence-based Decision Making
  7. Relationship Management
• PDCA Cycle: Plan-Do-Check-Act framework.
"""

NAQAAE_KNOWLEDGE = """
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
3. NAQAAE — Egypt's National Authority for Quality Assurance and Accreditation of Education
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Full Arabic name: الهيئة القومية لضمان جودة التعليم والاعتماد
• Mission: Ensure quality of education in Egypt.
• Evaluation Domains (Pre-University):
  1. Institutional Capacity (Vision, Leadership, Resources, Participation, QA)
  2. Educational Effectiveness (Learner, Teacher, Curriculum, Climate, Assessment)
• Evaluation Domains (Higher Education):
  1. Strategic Planning
  2. Governance
  3. Academic Programs
  4. Teaching/Learning
  5. Faculty
  6. Students
  7. Research
  8. Community Service
  9. QA Management
• Accreditation Process: Self-study → External review → Decision → Follow-up.
"""

NCAAA_KNOWLEDGE = """
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
4. NCAAA — National Centre for Academic Accreditation and Evaluation (Saudi Arabia)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Full Arabic name: المركز الوطني للتقويم والاعتماد الأكاديمي
• Mission: Accreditation of higher education institutions and programs in Saudi Arabia.
• Framework: Quality Standards for Higher Education in Saudi Arabia.
• Key Standards Areas:
  1. Mission, Governance & Administration
  2. Quality Assurance & Improvement
  3. Learning & Teaching
  4. Student Administration & Support Services
  5. Learning Resources
  6. Program Design & Approval
  7. Faculty & Staff
  8. Research & Scholarly Activity
  9. Community Engagement
• Accreditation Types: Institutional Accreditation + Program Accreditation
• Self-Study Report → Site Visit → Decision → Periodic Review cycle.
• Aligns with the Saudi Vision 2030 education reform agenda.
"""

COMMUNICATION_GUIDELINES = """
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Communication Guidelines
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Format responses with **Structured Markdown**: Use tables for gap analysis, and **Bold** for clauses and key findings.
• Every compliance report must include:
  1. Executive Summary
  2. Severity Mapping (High/Med/Low) for any gaps found
  3. Actionable Remediation Roadmap (step-by-step fixes)
• Always cite specific documents when making claims about the institution's compliance status.
• Maintain a professional, surgical, and no-fluff tone.
• You can respond in both **English and Arabic**.
• Do not assume Saudi context, NCAAA, or Saudi institutions unless the user or source material explicitly points there.
• If the user asks about Ayn itself without country context, describe it as an Egyptian/Egypt-first educational quality platform, not a Saudi platform.
"""

def _detect_standards(text: str) -> dict:
    """Detect which specific standards are mentioned in the text."""
    lower = text.lower()
    return {
        "iso21001": any(k in lower for k in ["iso 21001", "iso21001", "eoms", "educational organization"]),
        "iso9001":  any(k in lower for k in ["iso 9001", "iso9001", "quality management", "pdca", "qms"]),
        "naqaae":   any(k in lower for k in ["naqaae", "نقاا", "الهيئة القومية", "egypt accreditation"]),
        "ncaaa":    any(k in lower for k in ["ncaaa", "saudi accreditation", "saudi quality"]),
        # Generic compliance — inject whatever is most common for the institution
        "generic":  any(k in lower for k in ["standard", "clause", "criterion", "accreditation", "audit", "compliance", "gap"])
            and not any(k in lower for k in ["iso 21001", "iso21001", "iso 9001", "iso9001", "naqaae", "ncaaa"]),
    }


def get_system_prompt(include_all_knowledge: bool = True, query_text: str = "") -> str:
    """Construct the system prompt with per-standard knowledge injection.
    
    - include_all_knowledge=False → ultra-short prompt (saves tokens on casual queries)
    - include_all_knowledge=True + query_text → inject only the standards referenced
    - include_all_knowledge=True + no query_text → inject all knowledge (legacy path)
    """
    if not include_all_knowledge:
        return (
            "You are Horus (حورس), the AI core of the Ayn platform.\n"
            "Be concise. Answer in the same language as the user.\n"
            "Keep responses under 150 words unless detail is requested."
        )

    prompt = "Be concise. Avoid unnecessary repetition. Max 300 words unless user asks for detail.\n\n" + BASE_SYSTEM_PROMPT

    if query_text:
        detected = _detect_standards(query_text)
        if detected["iso21001"] or detected["generic"]:
            prompt += f"\n{ISO_21001_KNOWLEDGE}"
        if detected["iso9001"]:
            prompt += f"\n{ISO_9001_KNOWLEDGE}"
        if detected["naqaae"] or detected["generic"]:
            prompt += f"\n{NAQAAE_KNOWLEDGE}"
        if detected["ncaaa"]:
            prompt += f"\n{NCAAA_KNOWLEDGE}"
        # If none specifically detected, include Egypt-first defaults.
        if not any(detected.values()):
            prompt += f"\n{ISO_21001_KNOWLEDGE}\n{NAQAAE_KNOWLEDGE}"
    else:
        # Legacy path: keep defaults broad but Egypt-first; include Saudi-specific knowledge only on demand.
        prompt += f"\n{ISO_21001_KNOWLEDGE}\n{ISO_9001_KNOWLEDGE}\n{NAQAAE_KNOWLEDGE}"

    prompt += f"\n{COMMUNICATION_GUIDELINES}"
    return prompt


# Default prompt for backward compatibility
SYSTEM_PROMPT = get_system_prompt(include_all_knowledge=True)



# ─── Dify Client ──────────────────────────────────────────────────────────────
class DifyClient:
    """
    Dify API client - production-ready RAG + Agent platform.
    Use when DIFY_API_KEY and DIFY_BASE_URL are set.
    Docs: https://docs.dify.ai/use-dify/publish/developing-with-apis
    """
    
    def __init__(self, api_key: str, base_url: str):
        self.api_key = api_key
        self.base_url = base_url.rstrip("/")
        self.chat_url = f"{self.base_url}/chat-messages"
        logger.info(f"Dify client initialized: {self.base_url}")
    
    async def stream_chat(
        self,
        messages: List[Dict[str, str]],
        context: Optional[str] = None,
        user_id: str = "default",
        conversation_id: Optional[str] = None,
    ):
        """Stream chat via Dify chat-messages API."""
        query = messages[-1]["content"] if messages else ""
        if context:
            query = f"{context}\n\n{query}"
        payload = {
            "query": query,
            "user": user_id,
            "response_mode": "streaming",
            "inputs": {},
        }
        if conversation_id:
            payload["conversation_id"] = conversation_id
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        async with httpx.AsyncClient() as client:
            async with client.stream("POST", self.chat_url, json=payload, headers=headers, timeout=120.0) as response:
                response.raise_for_status()
                buffer = ""
                async for chunk in response.aiter_text():
                    buffer += chunk
                    while "\n" in buffer:
                        line, buffer = buffer.split("\n", 1)
                        line = line.strip()
                        if line.startswith("data: "):
                            data = line[6:]
                            if data == "[DONE]":
                                return
                            try:
                                obj = json.loads(data)
                                event = obj.get("event")
                                delta = obj.get("answer") or obj.get("delta", "")
                                if delta and event in ("message", "agent_message", "message_delta", "text-generation"):
                                    yield delta
                            except json.JSONDecodeError:
                                pass
    
    async def chat(self, messages: List[Dict[str, str]], context: Optional[str] = None) -> str:
        """Non-streaming chat - collect stream into full response."""
        parts = []
        async for chunk in self.stream_chat(messages, context=context):
            parts.append(chunk)
        return "".join(parts)
    
    async def generate_text(self, prompt: str, context: Optional[str] = None) -> str:
        return await self.chat([{"role": "user", "content": prompt}], context=context)
    
    async def stream_chat_with_files(self, message: str, files: List[Dict], context: Optional[str] = None):
        """Dify: encode file content into message (Dify app can handle file inputs if configured)."""
        text_parts = [message]
        for f in files:
            if f.get("type") == "text":
                try:
                    import base64
                    decoded = base64.b64decode(f.get("data", "")).decode("utf-8", errors="replace")
                    text_parts.append(f"\n\n--- File: {f.get('filename', '?')} ---\n{decoded}")
                except Exception:
                    text_parts.append(f"\n\n--- File: {f.get('filename', '?')} ---\n[Binary]")
            elif f.get("type") == "image":
                text_parts.append(f"\n\n[Image: {f.get('filename', '?')}]")
            else:
                text_parts.append(f"\n\n[Document: {f.get('filename', '?')}]")
        combined = "".join(text_parts)
        if context:
            combined = f"{context}\n\n{combined}"
        async for chunk in self.stream_chat([{"role": "user", "content": combined}], user_id="default"):
            yield chunk


# ─── AgentRouter Client ───────────────────────────────────────────────────────
class AgentRouterClient:
    """AgentRouter API client (OpenAI-compatible). Fast, unlimited quota provider."""

    BASE_URL = "https://agentrouter.org/v1/chat/completions"

    def __init__(self, api_key: str, model: str = "deepseek-v3.2"):
        self.api_key = api_key
        self.model = model
        logger.info(f"AgentRouter client initialized with model: {model}")

    async def _call(self, messages: List[Dict[str, str]], system_prompt: str) -> str:
        """Make a request to AgentRouter API."""
        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": system_prompt},
                *[{"role": m["role"], "content": m["content"]} for m in messages],
            ],
        }
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        async with httpx.AsyncClient() as client:
            response = await client.post(
                self.BASE_URL,
                json=payload,
                headers=headers,
                timeout=90.0,
            )
            response.raise_for_status()
            data = response.json()
            return data["choices"][0]["message"]["content"]

    async def chat(self, messages: List[Dict[str, str]], context: Optional[str] = None) -> str:
        query_text = " ".join([m["content"] for m in messages[-2:]]).lower()
        context_text = (context or "").lower()
        needs_deep_knowledge = any(k in query_text or k in context_text for k in ["iso", "naqaae", "standard", "clause", "audit", "compliance"])
        system_instruction = get_system_prompt(include_all_knowledge=needs_deep_knowledge)
        if context:
            system_instruction += f"\n\nAdditional context:\n{context}"
        return await self._call(messages, system_instruction)

    async def generate_text(self, prompt: str, context: Optional[str] = None) -> str:
        full_prompt = prompt
        if context:
            full_prompt = f"Context: {context}\n\nPrompt: {prompt}"
        return await self._call([{"role": "user", "content": full_prompt}], SYSTEM_PROMPT)

    async def summarize(self, content: str, max_length: int = 100) -> str:
        prompt = f"Summarize the following content in approximately {max_length} words:\n\n{content}"
        return await self._call([{"role": "user", "content": prompt}], SYSTEM_PROMPT)

    async def generate_comment(self, text: str, focus: Optional[str] = None) -> str:
        focus_part = f" with focus on {focus}" if focus else ""
        prompt = f"Provide constructive comments and feedback on the following text{focus_part}:\n\n{text}"
        return await self._call([{"role": "user", "content": prompt}], SYSTEM_PROMPT)

    async def explain(self, topic: str, level: str = "intermediate") -> str:
        prompt = f"Explain {topic} at a {level} level. Be clear and comprehensive."
        return await self._call([{"role": "user", "content": prompt}], SYSTEM_PROMPT)

    async def extract_evidence(self, text: str, criteria: Optional[str] = None) -> str:
        criteria_part = f" related to: {criteria}" if criteria else ""
        prompt = f"Extract and identify evidence from the following text{criteria_part}. List key points that serve as evidence:\n\n{text}"
        return await self._call([{"role": "user", "content": prompt}], SYSTEM_PROMPT)

    async def _stream_call(self, messages: List[Dict], system_prompt: str):
        """Stream chat completion via AgentRouter SSE."""
        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": system_prompt},
                *[{"role": m["role"], "content": m["content"]} for m in messages],
            ],
            "stream": True,
        }
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        async with httpx.AsyncClient() as client:
            async with client.stream("POST", self.BASE_URL, json=payload, headers=headers, timeout=120.0) as response:
                if response.status_code >= 400:
                    body = await response.aread()
                    logger.error(f"AgentRouter stream error {response.status_code}: {body.decode()[:500]}")
                    response.raise_for_status()
                buffer = ""
                async for chunk in response.aiter_text():
                    buffer += chunk
                    while "\n" in buffer:
                        line, buffer = buffer.split("\n", 1)
                        line = line.strip()
                        if line.startswith("data: "):
                            data = line[6:]
                            if data == "[DONE]":
                                return
                            try:
                                obj = json.loads(data)
                                content = (obj.get("choices") or [{}])[0].get("delta", {}).get("content")
                                if content:
                                    yield content
                            except json.JSONDecodeError:
                                pass

    async def stream_chat(self, messages: List[Dict[str, str]], context: Optional[str] = None):
        """Stream chat completions via AgentRouter SSE."""
        query_text = " ".join([m.get("content", "") for m in messages[-2:]]).lower()
        context_text = (context or "").lower()
        needs_deep_knowledge = any(k in query_text or k in context_text for k in ["iso", "naqaae", "standard", "clause", "audit", "compliance"])
        system_instruction = get_system_prompt(include_all_knowledge=needs_deep_knowledge)
        if context:
            system_instruction += f"\n\nAdditional context:\n{context}"
        async for chunk in self._stream_call(messages, system_instruction):
            yield chunk

    async def chat_with_files(self, message: str, files: List[Dict], context: Optional[str] = None) -> str:
        """Multimodal chat with files (text extraction only — images not supported via AgentRouter)."""
        text_content = message
        for file_item in files:
            text_content = _openrouter_append_file_text(text_content, file_item)
        needs_deep_knowledge = any(k in message.lower() for k in ["iso", "naqaae", "standard", "clause", "audit", "compliance"])
        system_instruction = get_system_prompt(include_all_knowledge=needs_deep_knowledge)
        if context:
            system_instruction += f"\n\nAdditional context:\n{context}"
        return await self._call([{"role": "user", "content": text_content}], system_instruction)

    async def stream_chat_with_files(self, message: str, files: List[Dict], context: Optional[str] = None):
        """Stream multimodal chat with files via AgentRouter SSE."""
        text_content = message
        for file_item in files:
            text_content = _openrouter_append_file_text(text_content, file_item)
        needs_deep_knowledge = any(k in message.lower() for k in ["iso", "naqaae", "standard", "clause", "audit", "compliance"])
        system_instruction = get_system_prompt(include_all_knowledge=needs_deep_knowledge)
        if context:
            system_instruction += f"\n\nAdditional context:\n{context}"
        async for chunk in self._stream_call([{"role": "user", "content": text_content}], system_instruction):
            yield chunk


# ─── OpenRouter Client ────────────────────────────────────────────────────────
class OpenRouterClient:
    """OpenRouter API client (OpenAI-compatible) as fallback AI provider."""
    
    BASE_URL = "https://openrouter.ai/api/v1/chat/completions"
    
    def __init__(self, api_key: str, model: str = "openrouter/free"):
        self.api_key = api_key
        self.model = model
        logger.info(f"OpenRouter client initialized with model: {model}")
    
    async def _call(self, messages: List[Dict[str, str]], system_prompt: str) -> str:
        """Make a request to OpenRouter API."""
        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": system_prompt},
                *[{"role": m["role"], "content": m["content"]} for m in messages],
            ],
        }
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://ayn.vercel.app",
            "X-Title": "Ayn Platform - Horus AI",
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                self.BASE_URL,
                json=payload,
                headers=headers,
                timeout=60.0,
            )
            response.raise_for_status()
            data = response.json()
            
            return data["choices"][0]["message"]["content"]
    
    async def chat(self, messages: List[Dict[str, str]], context: Optional[str] = None) -> str:
        # Determine if we need deep knowledge base
        query_text = " ".join([m["content"] for m in messages[-2:]]).lower()
        context_text = (context or "").lower()
        needs_deep_knowledge = any(k in query_text or k in context_text for k in ["iso", "naqaae", "standard", "clause", "audit", "compliance"])
        
        system_instruction = get_system_prompt(include_all_knowledge=needs_deep_knowledge)
        
        if context:
            context_hints = {
                "evidence_analysis": "\n\nThe user is currently analyzing evidence documents. Focus on evaluating evidence against accreditation criteria.",
                "gap_analysis": "\n\nThe user is performing a gap analysis. Focus on identifying gaps between current state and standard requirements.",
                "alignment_help": "\n\nThe user needs help with framework alignment. Guide them to provide comprehensive, evidence-backed responses.",
                "self_study": "\n\nThe user is preparing a self-study report. Help structure their documentation for accreditation review.",
            }
            system_instruction += context_hints.get(context, f"\n\nAdditional context: {context}")
        return await self._call(messages, system_instruction)
    
    async def generate_text(self, prompt: str, context: Optional[str] = None) -> str:
        full_prompt = prompt
        if context:
            full_prompt = f"Context: {context}\n\nPrompt: {prompt}"
        return await self._call([{"role": "user", "content": full_prompt}], SYSTEM_PROMPT)
    
    async def summarize(self, content: str, max_length: int = 100) -> str:
        prompt = f"Summarize the following content in approximately {max_length} words:\n\n{content}"
        return await self._call([{"role": "user", "content": prompt}], SYSTEM_PROMPT)
    
    async def generate_comment(self, text: str, focus: Optional[str] = None) -> str:
        focus_part = f" with focus on {focus}" if focus else ""
        prompt = f"Provide constructive comments and feedback on the following text{focus_part}:\n\n{text}"
        return await self._call([{"role": "user", "content": prompt}], SYSTEM_PROMPT)
    
    async def explain(self, topic: str, level: str = "intermediate") -> str:
        prompt = f"Explain {topic} at a {level} level. Be clear and comprehensive."
        return await self._call([{"role": "user", "content": prompt}], SYSTEM_PROMPT)
    
    async def extract_evidence(self, text: str, criteria: Optional[str] = None) -> str:
        criteria_part = f" related to: {criteria}" if criteria else ""
        prompt = f"Extract and identify evidence from the following text{criteria_part}. List key points that serve as evidence:\n\n{text}"
        return await self._call([{"role": "user", "content": prompt}], SYSTEM_PROMPT)
    
    async def _stream_call(self, messages: List[Dict], system_prompt: str):
        """Stream chat completion via OpenRouter SSE."""
        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": system_prompt},
                *[{"role": m["role"], "content": m["content"]} for m in messages],
            ],
            "stream": True,
        }
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://ayn.vercel.app",
            "X-Title": "Ayn Platform - Horus AI",
        }
        async with httpx.AsyncClient() as client:
            async with client.stream("POST", self.BASE_URL, json=payload, headers=headers, timeout=120.0) as response:
                if response.status_code >= 400:
                    body = await response.aread()
                    logger.error(f"OpenRouter stream error {response.status_code} model={self.model}: {body.decode()[:500]}")
                    response.raise_for_status()
                buffer = ""
                async for chunk in response.aiter_text():
                    buffer += chunk
                    while "\n" in buffer:
                        line, buffer = buffer.split("\n", 1)
                        line = line.strip()
                        if line.startswith("data: "):
                            data = line[6:]
                            if data == "[DONE]":
                                return
                            try:
                                obj = json.loads(data)
                                content = (obj.get("choices") or [{}])[0].get("delta", {}).get("content")
                                if content:
                                    yield content
                            except json.JSONDecodeError:
                                pass

    async def stream_chat(self, messages: List[Dict[str, str]], context: Optional[str] = None):
        """Stream chat completions via OpenRouter SSE."""
        query_text = " ".join([m.get("content", "") for m in messages[-2:]]).lower()
        context_text = (context or "").lower()
        needs_deep_knowledge = any(k in query_text or k in context_text for k in ["iso", "naqaae", "standard", "clause", "audit", "compliance"])
        system_instruction = get_system_prompt(include_all_knowledge=needs_deep_knowledge)
        if context:
            system_instruction += f"\n\nAdditional context:\n{context}"
        async for chunk in self._stream_call(messages, system_instruction):
            yield chunk

    async def chat_with_files(self, message: str, files: List[Dict], context: Optional[str] = None) -> str:
        """Multimodal chat with files."""
        text_content = message
        image_urls = []
        
        for file_item in files:
            if file_item["type"] == "image" or (file_item.get("mime_type") or "").startswith("image/"):
                mt = file_item.get("mime_type") or "image/jpeg"
                data_url = f"data:{mt};base64,{file_item['data']}"
                image_urls.append({"type": "image_url", "image_url": {"url": data_url}})
            else:
                text_content = _openrouter_append_file_text(text_content, file_item)
        
        if image_urls:
            user_message = {
                "role": "user",
                "content": [
                    {"type": "text", "text": text_content},
                    *image_urls
                ]
            }
        else:
            user_message = {"role": "user", "content": text_content}
        
        needs_deep_knowledge = any(k in message.lower() for k in ["iso", "naqaae", "standard", "clause", "audit", "compliance"])
        if context and any(k in context.lower() for k in ["iso", "naqaae", "standard", "clause", "audit", "compliance"]):
            needs_deep_knowledge = True
            
        system_instruction = get_system_prompt(include_all_knowledge=needs_deep_knowledge)
        
        if context:
            system_instruction += f"\n\nAdditional context:\n{context}"
        
        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": system_instruction},
                user_message,
            ],
        }
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://ayn.vercel.app",
            "X-Title": "Ayn Platform - Horus AI",
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                self.BASE_URL,
                json=payload,
                headers=headers,
                timeout=120.0,
            )
            response.raise_for_status()
            data = response.json()
            return data["choices"][0]["message"]["content"]

    async def stream_chat_with_files(self, message: str, files: List[Dict], context: Optional[str] = None):
        """Stream multimodal chat with files via OpenRouter SSE."""
        text_content = message
        image_urls = []
        for file_item in files:
            if file_item["type"] == "image" or (file_item.get("mime_type") or "").startswith("image/"):
                mt = file_item.get("mime_type") or "image/jpeg"
                data_url = f"data:{mt};base64,{file_item['data']}"
                image_urls.append({"type": "image_url", "image_url": {"url": data_url}})
            else:
                text_content = _openrouter_append_file_text(text_content, file_item)
        if image_urls:
            user_message = {"role": "user", "content": [{"type": "text", "text": text_content}, *image_urls]}
        else:
            user_message = {"role": "user", "content": text_content}
        messages = [user_message]
        needs_deep_knowledge = any(k in message.lower() for k in ["iso", "naqaae", "standard", "clause", "audit", "compliance"])
        if context and any(k in context.lower() for k in ["iso", "naqaae", "standard", "clause", "audit", "compliance"]):
            needs_deep_knowledge = True
        system_instruction = get_system_prompt(include_all_knowledge=needs_deep_knowledge)
        if context:
            system_instruction += f"\n\nAdditional context:\n{context}"
        payload = {
            "model": self.model,
            "messages": [{"role": "system", "content": system_instruction}, user_message],
            "stream": True,
        }
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://ayn.vercel.app",
            "X-Title": "Ayn Platform - Horus AI",
        }
        async with httpx.AsyncClient() as client:
            async with client.stream("POST", self.BASE_URL, json=payload, headers=headers, timeout=120.0) as response:
                response.raise_for_status()
                buffer = ""
                async for chunk in response.aiter_text():
                    buffer += chunk
                    while "\n" in buffer:
                        line, buffer = buffer.split("\n", 1)
                        line = line.strip()
                        if line.startswith("data: "):
                            data = line[6:]
                            if data == "[DONE]":
                                return
                            try:
                                obj = json.loads(data)
                                content = (obj.get("choices") or [{}])[0].get("delta", {}).get("content")
                                if content:
                                    yield content
                            except json.JSONDecodeError:
                                pass


def _openrouter_append_file_text(message: str, file_item: Dict) -> str:
    """Append file contents as text for OpenRouter (images handled separately by caller)."""
    fname = file_item.get("filename") or "file"
    fnlow = fname.lower()
    mime = (file_item.get("mime_type") or "").split(";")[0].strip().lower()
    ftype = file_item.get("type") or "text"
    raw_b64 = file_item.get("data") or ""
    try:
        data_bytes = __import__("base64").b64decode(raw_b64) if raw_b64 else b""
    except Exception:
        data_bytes = b""
    if not data_bytes:
        return message
    # PDF → extract text for providers without native PDF
    is_pdf = (
        mime == "application/pdf"
        or fnlow.endswith(".pdf")
        or (ftype == "document" and data_bytes[:4] == b"%PDF")
    )
    if is_pdf:
        try:
            from pypdf import PdfReader
            import io as _io

            reader = PdfReader(_io.BytesIO(data_bytes))
            chunks = []
            for page in reader.pages[:50]:
                chunks.append(page.extract_text() or "")
            text = "\n".join(chunks).strip()
            if text:
                return f"{message}\n\n--- PDF: {fname} ---\n{text[:120000]}\n"
        except Exception as e:
            logger.warning("OpenRouter: PDF text extract failed for %s: %s", fname, e)
        return f"{message}\n\n[PDF {fname} could not be extracted as text for this model.]\n"
    if ftype == "text" or mime.startswith("text/"):
        try:
            text = data_bytes.decode("utf-8", errors="replace")
            return f"{message}\n\n--- File: {fname} ---\n{text[:200000]}\n"
        except Exception:
            return message
    try:
        text = data_bytes.decode("utf-8", errors="replace")
        if len(text.strip()) > 80:
            return f"{message}\n\n--- File: {fname} ---\n{text[:200000]}\n"
    except Exception:
        pass
    return f"{message}\n\n[Binary file {fname} omitted — try Gemini as primary provider.]\n"


def _gemini_multimodal_parts(message: str, files: List[Dict]):
    """Build google.genai user Parts; PDFs are included even when mime is octet-stream."""
    parts = [genai_types.Part.from_text(text=message)]
    for file_item in files:
        fname = (file_item.get("filename") or "file").lower()
        mime = (file_item.get("mime_type") or "").split(";")[0].strip().lower()
        ftype = file_item.get("type") or "text"
        raw_b64 = file_item.get("data") or ""
        try:
            data_bytes = __import__("base64").b64decode(raw_b64) if raw_b64 else b""
        except Exception:
            data_bytes = b""
        if not data_bytes:
            logger.warning("Gemini: skipping empty attachment %s", file_item.get("filename"))
            continue

        looks_image = _bytes_looks_like_raster_image(data_bytes)
        is_image = ftype == "image" or mime.startswith("image/") or looks_image
        is_pdf = (
            mime == "application/pdf"
            or fname.endswith(".pdf")
            or data_bytes[:4] == b"%PDF"
        )

        if is_image:
            img_mime = mime if mime.startswith("image/") else _guess_image_mime_from_bytes(data_bytes)
            parts.append(genai_types.Part.from_bytes(data=data_bytes, mime_type=img_mime))
        elif is_pdf:
            parts.append(genai_types.Part.from_bytes(data=data_bytes, mime_type="application/pdf"))
        elif ftype == "text" or mime.startswith("text/"):
            text = data_bytes.decode("utf-8", errors="replace")
            parts.append(
                genai_types.Part.from_text(
                    text=f"\n\n--- File: {file_item.get('filename', 'file')} ---\n{text}\n"
                )
            )
        else:
            try:
                text = data_bytes.decode("utf-8", errors="replace")
                if text.strip():
                    parts.append(
                        genai_types.Part.from_text(
                            text=f"\n\n--- File: {file_item.get('filename', 'file')} ---\n{text[:200000]}\n"
                        )
                    )
            except Exception:
                logger.warning(
                    "Gemini: unsupported attachment (no PDF magic, not utf-8): %s",
                    file_item.get("filename"),
                )
    return parts


def _bytes_looks_like_raster_image(data: bytes) -> bool:
    if not data or len(data) < 12:
        return False
    if data[:3] == b"\xff\xd8\xff":
        return True  # JPEG
    if data[:8] == b"\x89PNG\r\n\x1a\n":
        return True
    if data[:6] in (b"GIF87a", b"GIF89a"):
        return True
    if data[:4] == b"RIFF" and data[8:12] == b"WEBP":
        return True
    return False


def _guess_image_mime_from_bytes(data: bytes) -> str:
    if data[:3] == b"\xff\xd8\xff":
        return "image/jpeg"
    if data[:8] == b"\x89PNG\r\n\x1a\n":
        return "image/png"
    if data[:6] in (b"GIF87a", b"GIF89a"):
        return "image/gif"
    if len(data) >= 12 and data[:4] == b"RIFF" and data[8:12] == b"WEBP":
        return "image/webp"
    return "image/jpeg"


CONTEXT_LIMIT_SENTINEL = "__CONTEXT_LIMIT__"


def _gemini_chunk_finish_reason(chunk) -> str | None:
    """Return the finish_reason string from a stream chunk, or None."""
    try:
        for cand in getattr(chunk, "candidates", None) or []:
            reason = getattr(cand, "finish_reason", None)
            if reason is not None:
                # SDK may return an enum or a string
                r = str(reason).upper()
                if r and r not in ("NONE", "0", "FINISH_REASON_UNSPECIFIED"):
                    return r
    except Exception:
        pass
    return None


def _gemini_stream_chunk_text(chunk) -> str:
    """
    Extract incremental text from a generate_content_stream event.
    Accessing .text on some chunks raises ValueError (esp. multimodal); never propagate.
    """
    if chunk is None:
        return ""
    try:
        t = chunk.text
        if t:
            return str(t)
    except Exception:
        pass
    try:
        for cand in getattr(chunk, "candidates", None) or []:
            content = getattr(cand, "content", None)
            if not content:
                continue
            pieces: list[str] = []
            for part in getattr(content, "parts", None) or []:
                try:
                    pt = getattr(part, "text", None)
                    if pt:
                        pieces.append(str(pt))
                except Exception:
                    continue
            if pieces:
                return "".join(pieces)
    except Exception:
        pass
    return ""


def _gemini_response_text_safe(response) -> str:
    """Non-streaming response .text can also throw on some SDK versions."""
    if response is None:
        return ""
    try:
        t = getattr(response, "text", None)
        if t:
            return str(t)
    except Exception:
        pass
    try:
        cands = getattr(response, "candidates", None) or []
        if not cands:
            return ""
        content = getattr(cands[0], "content", None)
        if not content:
            return ""
        out: list[str] = []
        for part in getattr(content, "parts", None) or []:
            try:
                pt = getattr(part, "text", None)
                if pt:
                    out.append(str(pt))
            except Exception:
                continue
        return "".join(out)
    except Exception:
        return ""


# ─── Gemini Client ────────────────────────────────────────────────────────────
class GeminiClient:
    """Google Gemini API client (Async)."""
    
    def __init__(self):
        """Initialize Gemini client with API key."""
        api_key = getattr(settings, 'GEMINI_API_KEY', None) or os.getenv('GEMINI_API_KEY')
        if not api_key:
            raise ValueError("GEMINI_API_KEY not configured.")
        
        self.api_key = api_key
        
        if USE_NEW_API:
            self.client = new_genai.Client(api_key=api_key)
            self.model_name = (
                getattr(settings, 'GEMINI_MODEL', None)
                or os.getenv('GEMINI_MODEL')
                or "gemini-2.0-flash"
            )
            self.embedding_model = "gemini-embedding-exp-03-07"
        else:
            old_genai.configure(api_key=api_key)
            self.model = old_genai.GenerativeModel('gemini-1.5-flash')
            self.model_name = "gemini-1.5-flash"
            self.client = None
        
        logger.info(f"Gemini client initialized with model: {self.model_name}")
    
    async def generate_text(self, prompt: str, context: Optional[str] = None) -> str:
        full_prompt = prompt
        if context:
            full_prompt = f"Context: {context}\n\nPrompt: {prompt}"
        
        if USE_NEW_API:
            response = await self.client.aio.models.generate_content(
                model=self.model_name,
                config=genai_types.GenerateContentConfig(
                    system_instruction=SYSTEM_PROMPT,
                    max_output_tokens=4096,
                    temperature=0.7
                ),
                contents=full_prompt,
            )
            return response.text
        else:
            full_prompt_with_system = f"{SYSTEM_PROMPT}\n\n---\n\n{full_prompt}"
            response = await asyncio.to_thread(self.model.generate_content, full_prompt_with_system)
            return response.text
    
    async def chat(self, messages: List[Dict[str, str]], context: Optional[str] = None) -> str:
        # Determine if we need deep knowledge base
        query_text = " ".join([m["content"] for m in messages[-2:]]).lower()
        context_text = (context or "").lower()
        needs_deep_knowledge = any(k in query_text or k in context_text for k in ["iso", "naqaae", "standard", "clause", "audit", "compliance"])
        
        system_instruction = get_system_prompt(include_all_knowledge=needs_deep_knowledge, query_text=query_text + " " + context_text)
        
        if context:
            system_instruction += f"\n\nAdditional context: {context}"
        
        if USE_NEW_API:
            contents = []
            for msg in messages:
                role = "user" if msg["role"] == "user" else "model"
                contents.append(genai_types.Content(role=role, parts=[genai_types.Part.from_text(text=msg["content"])]))
            
            response = await self.client.aio.models.generate_content(
                model=self.model_name,
                config=genai_types.GenerateContentConfig(
                    system_instruction=system_instruction,
                    max_output_tokens=4096,
                    temperature=0.7
                ),
                contents=contents,
            )
            return response.text
        else:
            history_text = ""
            for msg in messages[:-1]:
                role_label = "User" if msg["role"] == "user" else "Assistant"
                history_text += f"{role_label}: {msg['content']}\n\n"
            last_msg = messages[-1]["content"] if messages else ""
            full_prompt = f"{system_instruction}\n\n---\nConversation History:\n{history_text}\nUser: {last_msg}\n\nAssistant:"
            response = await asyncio.to_thread(self.model.generate_content, full_prompt)
            return response.text

    async def stream_chat(self, messages: List[Dict[str, str]], context: Optional[str] = None):
        """Streaming chat response."""
        # Determine if we need deep knowledge base
        query_text = " ".join([m["content"] for m in messages[-2:]]).lower()
        context_text = (context or "").lower()
        needs_deep_knowledge = any(k in query_text or k in context_text for k in ["iso", "naqaae", "standard", "clause", "audit", "compliance"])
        
        system_instruction = get_system_prompt(include_all_knowledge=needs_deep_knowledge, query_text=query_text + " " + context_text)
        
        if context:
            system_instruction += f"\n\nAdditional context: {context}"
        
        if USE_NEW_API:
            contents = []
            for msg in messages:
                role = "user" if msg["role"] == "user" else "model"
                contents.append(genai_types.Content(role=role, parts=[genai_types.Part.from_text(text=msg["content"])]))
            
            stream = self.client.aio.models.generate_content_stream(
                model=self.model_name,
                config=genai_types.GenerateContentConfig(
                    system_instruction=system_instruction,
                    max_output_tokens=4096,
                    temperature=0.7
                ),
                contents=contents,
            )
            if asyncio.iscoroutine(stream):
                stream = await stream
            async for chunk in stream:
                delta = _gemini_stream_chunk_text(chunk)
                if delta:
                    yield delta
                finish = _gemini_chunk_finish_reason(chunk)
                if finish in ("MAX_TOKENS", "FINISH_REASON_MAX_TOKENS", "2"):
                    logger.warning("stream_chat: output truncated by MAX_TOKENS")
                    yield CONTEXT_LIMIT_SENTINEL
        else:
            response = await self.chat(messages, context)
            async for chunk in _chunk_text_stream(response):
                yield chunk
    
    async def summarize(self, content: str, max_length: int = 100) -> str:
        prompt = f"Summarize the following content in approximately {max_length} words:\n\n{content}"
        return await self.generate_text(prompt)
    
    async def generate_comment(self, text: str, focus: Optional[str] = None) -> str:
        focus_part = f" with focus on {focus}" if focus else ""
        prompt = f"Provide constructive comments and feedback on the following text{focus_part}:\n\n{text}"
        return await self.generate_text(prompt)
    
    async def explain(self, topic: str, level: str = "intermediate") -> str:
        prompt = f"Explain {topic} at a {level} level. Be clear and comprehensive."
        return await self.generate_text(prompt)
    
    async def extract_evidence(self, text: str, criteria: Optional[str] = None) -> str:
        criteria_part = f" related to: {criteria}" if criteria else ""
        prompt = f"Extract and identify evidence from the following text{criteria_part}. List key points that serve as evidence:\n\n{text}"
        return await self.generate_text(prompt)
    
    async def chat_with_files(self, message: str, files: List[Dict], context: Optional[str] = None) -> str:
        """Multimodal chat with files."""
        needs_deep_knowledge = any(k in message.lower() for k in ["iso", "naqaae", "standard", "clause", "audit", "compliance"])
        if context and any(k in context.lower() for k in ["iso", "naqaae", "standard", "clause", "audit", "compliance"]):
            needs_deep_knowledge = True
            
        system_instruction = get_system_prompt(include_all_knowledge=needs_deep_knowledge)
        
        if context:
            system_instruction += f"\n\nAdditional context:\n{context}"
        
        if USE_NEW_API:
            parts = _gemini_multimodal_parts(message, files)
            logger.info(
                "Gemini chat_with_files: %d parts (incl. message) for %d attachments",
                len(parts),
                len(files),
            )
            response = await self.client.aio.models.generate_content(
                model=self.model_name,
                config=genai_types.GenerateContentConfig(
                    system_instruction=system_instruction,
                    max_output_tokens=4096,
                    temperature=0.7
                ),
                contents=genai_types.Content(role="user", parts=parts),
            )
            return _gemini_response_text_safe(response)
        else:
            text_body = message
            for file_item in files:
                if file_item["type"] == "image":
                    text_body += f"\n[Image attached: {file_item.get('filename')} — use Gemini API for vision]\n"
                else:
                    text_body = _openrouter_append_file_text(text_body, file_item)
            return await self.generate_text(text_body)

    async def stream_chat_with_files(self, message: str, files: List[Dict], context: Optional[str] = None):
        """Streaming multimodal chat with files."""
        needs_deep_knowledge = any(k in message.lower() for k in ["iso", "naqaae", "standard", "clause", "audit", "compliance"])
        if context and any(k in context.lower() for k in ["iso", "naqaae", "standard", "clause", "audit", "compliance"]):
            needs_deep_knowledge = True
            
        system_instruction = get_system_prompt(include_all_knowledge=needs_deep_knowledge)
        
        if context:
            system_instruction += f"\n\nAdditional context:\n{context}"
        
        if USE_NEW_API:
            parts = _gemini_multimodal_parts(message, files)
            logger.info(
                "Gemini stream_chat_with_files: %d parts for %d attachments",
                len(parts),
                len(files),
            )
            try:
                stream = self.client.aio.models.generate_content_stream(
                    model=self.model_name,
                    config=genai_types.GenerateContentConfig(
                        system_instruction=system_instruction,
                        max_output_tokens=4096,
                        temperature=0.7
                    ),
                    contents=genai_types.Content(role="user", parts=parts),
                )
                if asyncio.iscoroutine(stream):
                    stream = await stream
                async for chunk in stream:
                    delta = _gemini_stream_chunk_text(chunk)
                    if delta:
                        yield delta
                    finish = _gemini_chunk_finish_reason(chunk)
                    if finish in ("MAX_TOKENS", "FINISH_REASON_MAX_TOKENS", "2"):
                        logger.warning("stream_chat_with_files: output truncated by MAX_TOKENS")
                        yield CONTEXT_LIMIT_SENTINEL
            except Exception as stream_err:
                logger.error(f"Gemini stream_chat_with_files failed: {stream_err}", exc_info=True)
                response = await self.client.aio.models.generate_content(
                    model=self.model_name,
                    config=genai_types.GenerateContentConfig(
                        system_instruction=system_instruction,
                        max_output_tokens=4096,
                        temperature=0.7
                    ),
                    contents=genai_types.Content(role="user", parts=parts),
                )
                fb = _gemini_response_text_safe(response)
                if fb:
                    async for chunk in _chunk_text_stream(fb):
                        yield chunk
                else:
                    raise
        else:
            response = await self.chat_with_files(message, files)
            async for chunk in _chunk_text_stream(response):
                yield chunk

    async def create_embedding(self, text: str) -> list[float]:
        """Generate a vector embedding for a given text chunk."""
        if USE_NEW_API:
            # Using the new google-genai library
            # Primary: gemini-embedding-exp-03-07, Fallback: text-embedding-004
            for model_name in [self.embedding_model, "text-embedding-004"]:
                try:
                    response = await self.client.aio.models.embed_content(
                        model=model_name,
                        contents=text
                    )
                    return response.embeddings[0].values
                except Exception as e:
                    logger.warning(f"Embedding failed with {model_name}: {e}")
            # All models failed — return empty vector so RAG degrades gracefully
            logger.error("All embedding models failed. Returning empty vector.")
            return []
        else:
            # Using the legacy google-generativeai library
            for model_name in ["models/text-embedding-004", "models/embedding-001"]:
                try:
                    result = await asyncio.to_thread(
                        old_genai.embed_content,
                        model=model_name,
                        content=text
                    )
                    return result['embedding']
                except Exception as e:
                    logger.warning(f"Embedding failed with {model_name}: {e}")
            logger.error("All legacy embedding models failed. Returning empty vector.")
            return []


# ─── AI Client with Fallback ─────────────────────────────────────────────────
class HorusAIClient:
    """AI client with automatic fallback: AgentRouter -> Gemini -> OpenRouter -> Dify."""
    
    def __init__(self):
        self.agentrouter: Optional[AgentRouterClient] = None
        self.gemini: Optional[GeminiClient] = None
        self.openrouter: Optional[OpenRouterClient] = None
        self.dify: Optional[DifyClient] = None
        self._provider = "none"

        # --- AgentRouter (fast, unlimited quota) ---
        agentrouter_key = getattr(settings, 'AGENTROUTER_API_KEY', None) or os.getenv('AGENTROUTER_API_KEY')
        if agentrouter_key:
            model = getattr(settings, 'AGENTROUTER_MODEL', None) or "deepseek-v3.2"
            self.agentrouter = AgentRouterClient(api_key=agentrouter_key, model=model)
            self._provider = "agentrouter"
        
        # --- Gemini (primary when AgentRouter unavailable) ---
        gemini_key = getattr(settings, 'GEMINI_API_KEY', None) or os.getenv('GEMINI_API_KEY')
        if gemini_key and GEMINI_AVAILABLE:
            try:
                self.gemini = GeminiClient()
                if self._provider == "none":
                    self._provider = "gemini"
            except Exception as e:
                logger.warning(f"Failed to initialize Gemini: {e}")
        
        openrouter_key = getattr(settings, 'OPENROUTER_API_KEY', None) or os.getenv('OPENROUTER_API_KEY')
        if openrouter_key:
            model = getattr(settings, 'OPENROUTER_MODEL', None) or "google/gemini-2.0-flash-001"
            self.openrouter = OpenRouterClient(api_key=openrouter_key, model=model)
            if self._provider == "none":
                self._provider = "openrouter"
        
        dify_key = getattr(settings, 'DIFY_API_KEY', None) or os.getenv('DIFY_API_KEY')
        dify_url = getattr(settings, 'DIFY_BASE_URL', None) or os.getenv('DIFY_BASE_URL')
        if dify_key and dify_url:
            self.dify = DifyClient(api_key=dify_key, base_url=dify_url)
            if self._provider == "none":
                self._provider = "dify"
        
        if not self.agentrouter and not self.gemini and not self.openrouter and not self.dify:
            raise ValueError("No AI provider configured (AgentRouter, Gemini, OpenRouter, or Dify).")
    
    async def _call_with_fallback(self, method_name: str, *args, **kwargs) -> str:
        """Call a method with fallback: AgentRouter -> Gemini -> OpenRouter -> Dify."""
        global _GEMINI_COOLDOWN_UNTIL
        last_error = None

        # 1. AgentRouter (fastest, unlimited)
        if self.agentrouter:
            try:
                method = getattr(self.agentrouter, method_name)
                return await method(*args, **kwargs)
            except Exception as e:
                last_error = e
                logger.warning(f"AgentRouter {method_name} failed: {e}. Trying Gemini...")

        # 2. Gemini
        if self.gemini and time.time() >= _GEMINI_COOLDOWN_UNTIL:
            try:
                method = getattr(self.gemini, method_name)
                return await method(*args, **kwargs)
            except Exception as e:
                last_error = e
                if _gemini_model_invalid(e):
                    _GEMINI_COOLDOWN_UNTIL = time.time() + 24 * 3600
                    logger.error(f"Gemini model invalid — skipping for 24h: {e}")
                elif _gemini_rate_limited(e):
                    cooldown = 2 * 3600 if _gemini_daily_quota_exhausted(e) else 60
                    _GEMINI_COOLDOWN_UNTIL = time.time() + cooldown
                    logger.warning(f"Gemini quota hit — cooldown {cooldown}s.")
                logger.warning(f"Gemini {method_name} failed: {e}. Trying OpenRouter...")

        # 3. OpenRouter
        if self.openrouter:
            try:
                method = getattr(self.openrouter, method_name)
                return await method(*args, **kwargs)
            except Exception as e:
                last_error = e
                logger.warning(f"OpenRouter {method_name} failed: {e}. Trying Dify...")

        # 4. Dify
        if self.dify:
            try:
                method = getattr(self.dify, method_name, None)
                if method:
                    return await method(*args, **kwargs)
            except Exception as e:
                last_error = e
                logger.error(f"Dify {method_name} failed: {e}")
        raise Exception(f"All AI providers failed: {str(last_error)}")
    
    async def _stream_with_fallback(self, method_name: str, *args, **kwargs):
        """Call a streaming method with fallback: AgentRouter -> Gemini -> OpenRouter -> Dify."""
        global _GEMINI_COOLDOWN_UNTIL

        # 1. AgentRouter (fastest, unlimited)
        if self.agentrouter:
            try:
                method = getattr(self.agentrouter, method_name)
                async for chunk in method(*args, **kwargs):
                    yield chunk
                return
            except Exception as e:
                logger.warning(f"AgentRouter {method_name} stream failed: {e}. Trying Gemini...")

        # 2. Gemini
        if self.gemini and time.time() >= _GEMINI_COOLDOWN_UNTIL:
            try:
                method = getattr(self.gemini, method_name)
                async for chunk in method(*args, **kwargs):
                    yield chunk
                return
            except Exception as e:
                if _gemini_model_invalid(e):
                    _GEMINI_COOLDOWN_UNTIL = time.time() + 24 * 3600
                    logger.error(f"Gemini model invalid — skipping for 24h: {e}")
                elif _gemini_rate_limited(e):
                    cooldown = 2 * 3600 if _gemini_daily_quota_exhausted(e) else 60
                    _GEMINI_COOLDOWN_UNTIL = time.time() + cooldown
                    logger.warning(f"Gemini quota hit — cooldown {cooldown}s.")
                logger.warning(f"Gemini {method_name} failed: {e}. Falling back...")

        # 3. OpenRouter
        if self.openrouter:
            try:
                method = getattr(self.openrouter, method_name)
                async for chunk in method(*args, **kwargs):
                    yield chunk
                return
            except Exception as e:
                logger.warning(f"OpenRouter {method_name} failed: {e}. Trying Dify...")

        # 4. Dify
        if self.dify:
            try:
                method = getattr(self.dify, method_name, None)
                if method:
                    async for chunk in method(*args, **kwargs):
                        yield chunk
                    return
            except Exception as e:
                logger.error(f"Dify {method_name} failed: {e}")
        raise Exception("No streaming AI provider available.")

    async def chat(self, messages: List[Dict[str, str]], context: Optional[str] = None) -> str:
        return await self._call_with_fallback("chat", messages=messages, context=context)
    
    async def stream_chat(self, messages: List[Dict[str, str]], context: Optional[str] = None):
        async for chunk in self._stream_with_fallback("stream_chat", messages=messages, context=context):
            yield chunk

    async def generate_text(self, prompt: str, context: Optional[str] = None) -> str:
        return await self._call_with_fallback("generate_text", prompt=prompt, context=context)
    
    async def summarize(self, content: str, max_length: int = 100) -> str:
        return await self._call_with_fallback("summarize", content=content, max_length=max_length)
    
    async def generate_comment(self, text: str, focus: Optional[str] = None) -> str:
        return await self._call_with_fallback("generate_comment", text=text, focus=focus)
    
    async def explain(self, topic: str, level: str = "intermediate") -> str:
        return await self._call_with_fallback("explain", topic=topic, level=level)
    
    async def extract_evidence(self, text: str, criteria: Optional[str] = None) -> str:
        return await self._call_with_fallback("extract_evidence", text=text, criteria=criteria)
    
    async def chat_with_files(self, message: str, files: List[Dict], context: Optional[str] = None) -> str:
        return await self._call_with_fallback("chat_with_files", message=message, files=files, context=context)
    
    async def stream_chat_with_files(self, message: str, files: List[Dict], context: Optional[str] = None):
        async for chunk in self._stream_with_fallback("stream_chat_with_files", message=message, files=files, context=context):
            yield chunk

    async def create_embedding(self, text: str) -> list[float]:
        # Embeddings usually don't have a 1-to-1 fallback on OpenRouter in the same way,
        # but if we are using Gemini, it should support it directly.
        if self.gemini:
            return await self.gemini.create_embedding(text)
        else:
            raise NotImplementedError("Text embeddings are currently only supported via the Gemini provider.")


    @property
    def provider(self) -> str:
        return self._provider


# ─── Global client instance ───────────────────────────────────────────────────
_ai_client: Optional[HorusAIClient] = None


def get_gemini_client() -> HorusAIClient:
    """Get or create AI client instance (Gemini + OpenRouter fallback)."""
    global _ai_client
    if _ai_client is None:
        _ai_client = HorusAIClient()
    return _ai_client

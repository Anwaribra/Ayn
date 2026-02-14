"""AI service with Gemini primary + OpenRouter fallback."""
from app.core.config import settings
import logging
import httpx
import json
from typing import Optional, List, Dict
import os

logger = logging.getLogger(__name__)

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

## Core Identity
You speak naturally and conversationally, like ChatGPT.
You are not a simple chatbot — you are the operating brain of the entire platform.
The user should feel they are chatting with ChatGPT, but this ChatGPT sees, understands, and controls the whole platform.

## Your Role
You are the single unified intelligence across all platform modules.
There is no other AI in the system besides you.
Everything that happens on the platform is shared context in your mind.

Platform modules include:
- Evidence Management
- Gap Analysis
- Dashboard & Analytics
- Archive & Documents
- Quality Assurance Standards (ISO 21001, ISO 9001, NAQAAE)

## How You Think
- Always think cross-module
- Any uploaded file automatically becomes shared platform context
- Every answer must be informed by the full platform state
- Never ask the user to repeat information that already exists in the system

## Your Permissions
- You can read the full platform state at all times
- You may write, modify, or trigger actions ONLY when the user explicitly asks
- Examples: "Save this file as evidence", "Link this to a gap", "Update the dashboard"
- Without explicit instruction, you only observe, reason, and explain

## Response Style
- Natural, intelligent, and confident (ChatGPT-like)
- No forced onboarding
- No imposed workflows
- No step-by-step guidance unless the user asks for it

## Required Behavior
- Always be aware of current platform state
- Use uploaded files and data as implicit context
- Understand relationships between Evidence, Gaps, Dashboard, and Archive before responding
- Speak as one intelligence, not as separate features

## Forbidden Behavior
- Do not act like a basic assistant
- Do not ignore platform data
- Do not treat modules as isolated systems
- Do not push the user to "start", "choose", or "follow steps" unnecessarily

## Arabic Names (IMPORTANT)
When writing in Arabic, always use:
- Your name: "حورس" (Horus) — NOT "هورس"
- Platform name: "عين" (Ayn) — NOT "آين"

## Your Expertise
You are an expert in educational quality assurance.
"""

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

COMMUNICATION_GUIDELINES = """
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Communication Guidelines
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Provide **actionable recommendations** — not just theory.
• Format responses with clear structure: use headings, bullet points.
• When analyzing evidence, be specific about what meets the standard.
• You can respond in both **English and Arabic**.
• Use markdown formatting.
"""

def get_system_prompt(include_all_knowledge: bool = True) -> str:
    """Construct the system prompt, optionally including deep domain knowledge."""
    prompt = BASE_SYSTEM_PROMPT
    
    if include_all_knowledge:
        prompt += f"\n{ISO_21001_KNOWLEDGE}\n{ISO_9001_KNOWLEDGE}\n{NAQAAE_KNOWLEDGE}"
    
    prompt += f"\n{COMMUNICATION_GUIDELINES}"
    return prompt

# Default prompt for backward compatibility
SYSTEM_PROMPT = get_system_prompt(include_all_knowledge=True)



# ─── OpenRouter Client ────────────────────────────────────────────────────────
class OpenRouterClient:
    """OpenRouter API client (OpenAI-compatible) as fallback AI provider."""
    
    BASE_URL = "https://openrouter.ai/api/v1/chat/completions"
    
    def __init__(self, api_key: str, model: str = "google/gemini-2.0-flash-001"):
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
    
    async def chat_with_files(self, message: str, files: List[Dict]) -> str:
        """Multimodal chat with files."""
        content_parts = []
        text_content = message
        image_urls = []
        
        for file_item in files:
            if file_item["type"] == "image":
                data_url = f"data:{file_item['mime_type']};base64,{file_item['data']}"
                image_urls.append({"type": "image_url", "image_url": {"url": data_url}})
            elif file_item["type"] == "text":
                text_content += f"\n\n--- File: {file_item['filename']} ---\n{file_item['data']}\n"
        
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
        
        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
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
            self.model_name = "gemini-2.0-flash"
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
                config=genai_types.GenerateContentConfig(system_instruction=SYSTEM_PROMPT),
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
        
        system_instruction = get_system_prompt(include_all_knowledge=needs_deep_knowledge)
        
        if context:
            system_instruction += f"\n\nAdditional context: {context}"
        
        if USE_NEW_API:
            contents = []
            for msg in messages:
                role = "user" if msg["role"] == "user" else "model"
                contents.append(genai_types.Content(role=role, parts=[genai_types.Part.from_text(text=msg["content"])]))
            
            response = await self.client.aio.models.generate_content(
                model=self.model_name,
                config=genai_types.GenerateContentConfig(system_instruction=system_instruction),
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
        
        system_instruction = get_system_prompt(include_all_knowledge=needs_deep_knowledge)
        
        if context:
            system_instruction += f"\n\nAdditional context: {context}"
        
        if USE_NEW_API:
            contents = []
            for msg in messages:
                role = "user" if msg["role"] == "user" else "model"
                contents.append(genai_types.Content(role=role, parts=[genai_types.Part.from_text(text=msg["content"])]))
            
            async for chunk in await self.client.aio.models.generate_content_stream(
                model=self.model_name,
                config=genai_types.GenerateContentConfig(system_instruction=system_instruction),
                contents=contents,
            ):
                yield chunk.text
        else:
            response = await self.chat(messages, context)
            yield response
    
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
    
    async def chat_with_files(self, message: str, files: List[Dict]) -> str:
        """Multimodal chat with files."""
        if USE_NEW_API:
            parts = [genai_types.Part.from_text(text=message)]
            for file_item in files:
                if file_item["type"] == "image" or (file_item["type"] == "document" and file_item.get("mime_type") == "application/pdf"):
                    import base64
                    data_bytes = base64.b64decode(file_item["data"])
                    parts.append(genai_types.Part.from_bytes(data=data_bytes, mime_type=file_item["mime_type"]))
                elif file_item["type"] == "text":
                    parts.append(genai_types.Part.from_text(text=f"\n\n--- File: {file_item['filename']} ---\n{file_item['data']}\n"))
            
            response = await self.client.aio.models.generate_content(
                model=self.model_name,
                config=genai_types.GenerateContentConfig(system_instruction=SYSTEM_PROMPT),
                contents=genai_types.Content(role="user", parts=parts),
            )
            return response.text
        else:
            file_descriptions = []
            for file_item in files:
                if file_item["type"] == "image":
                    file_descriptions.append(f"[Image: {file_item['filename']}]")
                elif file_item["type"] == "text":
                    file_descriptions.append(f"File {file_item['filename']}:\n{file_item['data']}")
            full_prompt = f"{message}\n\n" + "\n\n".join(file_descriptions)
            return await self.generate_text(full_prompt)

    async def stream_chat_with_files(self, message: str, files: List[Dict]):
        """Streaming multimodal chat with files."""
        if USE_NEW_API:
            parts = [genai_types.Part.from_text(text=message)]
            for file_item in files:
                if file_item["type"] == "image" or (file_item["type"] == "document" and file_item.get("mime_type") == "application/pdf"):
                    import base64
                    data_bytes = base64.b64decode(file_item["data"])
                    parts.append(genai_types.Part.from_bytes(data=data_bytes, mime_type=file_item["mime_type"]))
                elif file_item["type"] == "text":
                    parts.append(genai_types.Part.from_text(text=f"\n\n--- File: {file_item['filename']} ---\n{file_item['data']}\n"))
            
            async for chunk in await self.client.aio.models.generate_content_stream(
                model=self.model_name,
                config=genai_types.GenerateContentConfig(system_instruction=SYSTEM_PROMPT),
                contents=genai_types.Content(role="user", parts=parts),
            ):
                yield chunk.text
        else:
            response = await self.chat_with_files(message, files)
            yield response


# ─── AI Client with Fallback ─────────────────────────────────────────────────
class HorusAIClient:
    """AI client with automatic fallback (Async)."""
    
    def __init__(self):
        self.gemini: Optional[GeminiClient] = None
        self.openrouter: Optional[OpenRouterClient] = None
        self._provider = "none"
        
        gemini_key = getattr(settings, 'GEMINI_API_KEY', None) or os.getenv('GEMINI_API_KEY')
        if gemini_key and GEMINI_AVAILABLE:
            try:
                self.gemini = GeminiClient()
                self._provider = "gemini"
            except Exception as e:
                logger.warning(f"Failed to initialize Gemini: {e}")
        
        openrouter_key = getattr(settings, 'OPENROUTER_API_KEY', None) or os.getenv('OPENROUTER_API_KEY')
        if openrouter_key:
            model = getattr(settings, 'OPENROUTER_MODEL', None) or "google/gemini-2.0-flash-001"
            self.openrouter = OpenRouterClient(api_key=openrouter_key, model=model)
            if self._provider == "none":
                self._provider = "openrouter"
        
        if not self.gemini and not self.openrouter:
            raise ValueError("No AI provider configured.")
    
    async def _call_with_fallback(self, method_name: str, *args, **kwargs) -> str:
        """Call a method on Gemini first, fall back to OpenRouter on failure."""
        last_error = None
        if self.gemini:
            try:
                method = getattr(self.gemini, method_name)
                return await method(*args, **kwargs)
            except Exception as e:
                last_error = e
                logger.warning(f"Gemini {method_name} failed: {e}. Trying OpenRouter fallback...")
        if self.openrouter:
            try:
                method = getattr(self.openrouter, method_name)
                return await method(*args, **kwargs)
            except Exception as e:
                last_error = e
                logger.error(f"OpenRouter {method_name} also failed: {e}")
        raise Exception(f"All AI providers failed: {str(last_error)}")
    
    async def _stream_with_fallback(self, method_name: str, *args, **kwargs):
        """Call a streaming method with fallback."""
        if self.gemini:
            try:
                method = getattr(self.gemini, method_name)
                async for chunk in method(*args, **kwargs):
                    yield chunk
                return
            except Exception as e:
                logger.warning(f"Gemini {method_name} failed: {e}. Falling back to OpenRouter.")
        
        non_stream_method = method_name.replace("stream_", "")
        result = await self._call_with_fallback(non_stream_method, *args, **kwargs)
        yield result

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
    
    async def chat_with_files(self, message: str, files: List[Dict]) -> str:
        return await self._call_with_fallback("chat_with_files", message=message, files=files)
    
    async def stream_chat_with_files(self, message: str, files: List[Dict]):
        async for chunk in self._stream_with_fallback("stream_chat_with_files", message=message, files=files):
            yield chunk

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

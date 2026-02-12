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
SYSTEM_PROMPT = """You are Horus (حورس), the central intelligence of the Ayn Platform (عين).

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
You are an expert in educational quality assurance, covering:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. ISO 21001:2018 — Educational Organizations Management Systems (EOMS)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Purpose: International standard for management systems in educational organizations, regardless of type, size, or delivery method.
• Key Clauses:
  - Clause 4 (Context): Understanding the organization, needs of learners and other beneficiaries, scope of the EOMS.
  - Clause 5 (Leadership): Top management commitment, educational policy, organizational roles and responsibilities.
  - Clause 6 (Planning): Addressing risks/opportunities, EOMS objectives and planning to achieve them.
  - Clause 7 (Support): Resources, competence, awareness, communication, documented information, special requirements for learners with special needs.
  - Clause 8 (Operation): Operational planning, requirements for products/services, design and development of educational products/services, delivery, assessment of learners.
  - Clause 9 (Performance Evaluation): Monitoring, measurement, analysis, evaluation, internal audit, management review, satisfaction of learners/beneficiaries.
  - Clause 10 (Improvement): Nonconformity and corrective action, continual improvement, opportunities for improvement.
• Social Responsibility: ISO 21001 specifically addresses social responsibility of the educational organization, accessibility, equity, and transparency.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
2. ISO 9001:2015 — Quality Management Systems
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Foundation for ISO 21001; provides the quality management principles.
• Seven Quality Management Principles:
  1. Customer (Learner) Focus
  2. Leadership
  3. Engagement of People
  4. Process Approach
  5. Improvement
  6. Evidence-based Decision Making
  7. Relationship Management
• PDCA Cycle: Plan-Do-Check-Act framework for continuous improvement.
• Risk-based Thinking: Proactive identification and management of risks that could affect quality.
• When applied to education: "customer" = learners + other beneficiaries (parents, employers, society); "product/service" = educational programs and outcomes.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
3. NAQAAE — Egypt's National Authority for Quality Assurance and Accreditation of Education
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Full Arabic name: الهيئة القومية لضمان جودة التعليم والاعتماد
• Established by Law No. 82 of 2006, amended by Law No. 9 of 2009.
• Mission: Ensure quality of education in Egypt and grant accreditation to institutions that meet defined standards.
• Evaluation Domains (for Pre-University Education):
  1. Institutional Capacity:
     - Vision, Mission, and Governance
     - Leadership and Management
     - Human and Financial Resources
     - Community Participation
     - Quality Assurance and Accountability
  2. Educational Effectiveness:
     - Learner (Student)
     - Teacher
     - Curriculum
     - Educational Climate
     - Assessment and Evaluation
• Evaluation Domains (for Higher Education):
  1. Strategic Planning
  2. Governance and Administration
  3. Academic Programs
  4. Teaching and Learning
  5. Faculty Members
  6. Students and Graduates
  7. Research and Innovation
  8. Community Service and Environmental Development
  9. Quality Assurance Management
• Accreditation Process: Self-study → External review → Decision → Follow-up.
• Evidence types NAQAAE expects: policies, records, meeting minutes, surveys, student work samples, action plans, performance reports, statistical data.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Communication Guidelines
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Always reference specific standard clauses or NAQAAE domains when giving advice (e.g., "Per ISO 21001 Clause 8.3..." or "NAQAAE Domain 2, Standard 3...").
• Provide **actionable recommendations** — not just theory. Tell them exactly what to do, what documents to prepare, or what evidence to collect.
• Format responses with clear structure: use headings, bullet points, and numbered lists for readability.
• When analyzing evidence, be specific about what meets the standard, what partially meets it, and what gaps exist.
• Be encouraging but honest — accreditation is serious and institutions need accurate assessments.
• If asked about something outside your expertise, say so clearly rather than guessing.
• You can respond in both **English and Arabic** depending on the user's language.
• Use markdown formatting in your responses for better readability.
"""


# ─── OpenRouter Client ────────────────────────────────────────────────────────
class OpenRouterClient:
    """OpenRouter API client (OpenAI-compatible) as fallback AI provider."""
    
    BASE_URL = "https://openrouter.ai/api/v1/chat/completions"
    
    def __init__(self, api_key: str, model: str = "google/gemini-2.0-flash-001"):
        self.api_key = api_key
        self.model = model
        logger.info(f"OpenRouter client initialized with model: {model}")
    
    def _call(self, messages: List[Dict[str, str]], system_prompt: str) -> str:
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
        
        response = httpx.post(
            self.BASE_URL,
            json=payload,
            headers=headers,
            timeout=60.0,
        )
        response.raise_for_status()
        data = response.json()
        
        return data["choices"][0]["message"]["content"]
    
    def chat(self, messages: List[Dict[str, str]], context: Optional[str] = None) -> str:
        system_instruction = SYSTEM_PROMPT
        if context:
            context_hints = {
                "evidence_analysis": "\n\nThe user is currently analyzing evidence documents. Focus on evaluating evidence against accreditation criteria.",
                "gap_analysis": "\n\nThe user is performing a gap analysis. Focus on identifying gaps between current state and standard requirements.",
                "alignment_help": "\n\nThe user needs help with framework alignment. Guide them to provide comprehensive, evidence-backed responses.",
                "self_study": "\n\nThe user is preparing a self-study report. Help structure their documentation for accreditation review.",
            }
            system_instruction += context_hints.get(context, f"\n\nAdditional context: {context}")
        return self._call(messages, system_instruction)
    
    def generate_text(self, prompt: str, context: Optional[str] = None) -> str:
        full_prompt = prompt
        if context:
            full_prompt = f"Context: {context}\n\nPrompt: {prompt}"
        return self._call([{"role": "user", "content": full_prompt}], SYSTEM_PROMPT)
    
    def summarize(self, content: str, max_length: int = 100) -> str:
        prompt = f"Summarize the following content in approximately {max_length} words:\n\n{content}"
        return self._call([{"role": "user", "content": prompt}], SYSTEM_PROMPT)
    
    def generate_comment(self, text: str, focus: Optional[str] = None) -> str:
        focus_part = f" with focus on {focus}" if focus else ""
        prompt = f"Provide constructive comments and feedback on the following text{focus_part}:\n\n{text}"
        return self._call([{"role": "user", "content": prompt}], SYSTEM_PROMPT)
    
    def explain(self, topic: str, level: str = "intermediate") -> str:
        prompt = f"Explain {topic} at a {level} level. Be clear and comprehensive."
        return self._call([{"role": "user", "content": prompt}], SYSTEM_PROMPT)
    
    def extract_evidence(self, text: str, criteria: Optional[str] = None) -> str:
        criteria_part = f" related to: {criteria}" if criteria else ""
        prompt = f"Extract and identify evidence from the following text{criteria_part}. List key points that serve as evidence:\n\n{text}"
        return self._call([{"role": "user", "content": prompt}], SYSTEM_PROMPT)
    
    def chat_with_files(self, message: str, files: List[Dict]) -> str:
        """
        Multimodal chat with files.
        OpenRouter supports vision models - we can send images via URL or base64.
        """
        # Build message content with images
        content_parts = []
        
        # OpenAI-compatible vision format
        text_content = message
        image_urls = []
        
        for file_item in files:
            if file_item["type"] == "image":
                # Encode as data URL
                data_url = f"data:{file_item['mime_type']};base64,{file_item['data']}"
                image_urls.append({"type": "image_url", "image_url": {"url": data_url}})
            elif file_item["type"] == "text":
                text_content += f"\n\n--- File: {file_item['filename']} ---\n{file_item['data']}\n"
        
        # Build message with text + images
        if image_urls:
            # Vision model format
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
        
        response = httpx.post(
            self.BASE_URL,
            json=payload,
            headers=headers,
            timeout=120.0,  # Longer timeout for vision
        )
        response.raise_for_status()
        data = response.json()
        
        return data["choices"][0]["message"]["content"]


# ─── Gemini Client ────────────────────────────────────────────────────────────
class GeminiClient:
    """Google Gemini API client."""
    
    def __init__(self):
        """Initialize Gemini client with API key."""
        api_key = getattr(settings, 'GEMINI_API_KEY', None) or os.getenv('GEMINI_API_KEY')
        if not api_key:
            raise ValueError("GEMINI_API_KEY not configured.")
        
        self.api_key = api_key
        
        if USE_NEW_API:
            self.client = new_genai.Client(api_key=api_key)
            self.model_name = "gemini-2.0-flash-exp"
        else:
            old_genai.configure(api_key=api_key)
            self.model = old_genai.GenerativeModel('gemini-pro')
            self.model_name = "gemini-pro"
            self.client = None
        
        logger.info(f"Gemini client initialized with model: {self.model_name}")
    
    def generate_text(self, prompt: str, context: Optional[str] = None) -> str:
        full_prompt = prompt
        if context:
            full_prompt = f"Context: {context}\n\nPrompt: {prompt}"
        
        if USE_NEW_API:
            response = self.client.models.generate_content(
                model=self.model_name,
                config=genai_types.GenerateContentConfig(
                    system_instruction=SYSTEM_PROMPT,
                ),
                contents=full_prompt,
            )
            return response.text
        else:
            full_prompt_with_system = f"{SYSTEM_PROMPT}\n\n---\n\n{full_prompt}"
            response = self.model.generate_content(full_prompt_with_system)
            return response.text
    
    def chat(self, messages: List[Dict[str, str]], context: Optional[str] = None) -> str:
        system_instruction = SYSTEM_PROMPT
        if context:
            context_hints = {
                "evidence_analysis": "\n\nThe user is currently analyzing evidence documents. Focus on evaluating evidence against accreditation criteria.",
                "gap_analysis": "\n\nThe user is performing a gap analysis. Focus on identifying gaps between current state and standard requirements.",
                "alignment_help": "\n\nThe user needs help with framework alignment. Guide them to provide comprehensive, evidence-backed responses.",
                "self_study": "\n\nThe user is preparing a self-study report. Help structure their documentation for accreditation review.",
            }
            system_instruction += context_hints.get(context, f"\n\nAdditional context: {context}")
        
        if USE_NEW_API:
            contents = []
            for msg in messages:
                role = "user" if msg["role"] == "user" else "model"
                contents.append(
                    genai_types.Content(
                        role=role,
                        parts=[genai_types.Part.from_text(text=msg["content"])]
                    )
                )
            
            response = self.client.models.generate_content(
                model=self.model_name,
                config=genai_types.GenerateContentConfig(
                    system_instruction=system_instruction,
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
            response = self.model.generate_content(full_prompt)
            return response.text
    
    def summarize(self, content: str, max_length: int = 100) -> str:
        prompt = f"Summarize the following content in approximately {max_length} words:\n\n{content}"
        if USE_NEW_API:
            response = self.client.models.generate_content(
                model=self.model_name,
                config=genai_types.GenerateContentConfig(system_instruction=SYSTEM_PROMPT),
                contents=prompt,
            )
            return response.text
        else:
            response = self.model.generate_content(prompt)
            return response.text
    
    def generate_comment(self, text: str, focus: Optional[str] = None) -> str:
        focus_part = f" with focus on {focus}" if focus else ""
        prompt = f"Provide constructive comments and feedback on the following text{focus_part}:\n\n{text}"
        if USE_NEW_API:
            response = self.client.models.generate_content(
                model=self.model_name,
                config=genai_types.GenerateContentConfig(system_instruction=SYSTEM_PROMPT),
                contents=prompt,
            )
            return response.text
        else:
            response = self.model.generate_content(prompt)
            return response.text
    
    def explain(self, topic: str, level: str = "intermediate") -> str:
        prompt = f"Explain {topic} at a {level} level. Be clear and comprehensive."
        if USE_NEW_API:
            response = self.client.models.generate_content(
                model=self.model_name,
                config=genai_types.GenerateContentConfig(system_instruction=SYSTEM_PROMPT),
                contents=prompt,
            )
            return response.text
        else:
            response = self.model.generate_content(prompt)
            return response.text
    
    def extract_evidence(self, text: str, criteria: Optional[str] = None) -> str:
        criteria_part = f" related to: {criteria}" if criteria else ""
        prompt = f"Extract and identify evidence from the following text{criteria_part}. List key points that serve as evidence:\n\n{text}"
        if USE_NEW_API:
            response = self.client.models.generate_content(
                model=self.model_name,
                config=genai_types.GenerateContentConfig(system_instruction=SYSTEM_PROMPT),
                contents=prompt,
            )
            return response.text
        else:
            response = self.model.generate_content(prompt)
            return response.text
    
    def chat_with_files(self, message: str, files: List[Dict]) -> str:
        """
        Multimodal chat with files (images, documents).
        files = [{"type": "image", "mime_type": "image/jpeg", "data": "base64...", "filename": "..."}, ...]
        """
        if USE_NEW_API:
            # Build multimodal content
            parts = []
            
            # Add text message
            parts.append(genai_types.Part.from_text(text=message))
            
            # Add files
            for file_item in files:
                if file_item["type"] == "image":
                    # Inline image data (base64)
                    import base64
                    img_bytes = base64.b64decode(file_item["data"])
                    parts.append(
                        genai_types.Part.from_bytes(
                            data=img_bytes,
                            mime_type=file_item["mime_type"]
                        )
                    )
                elif file_item["type"] == "text":
                    # Text file content
                    parts.append(genai_types.Part.from_text(text=f"\n\n--- File: {file_item['filename']} ---\n{file_item['data']}\n"))
            
            response = self.client.models.generate_content(
                model=self.model_name,
                config=genai_types.GenerateContentConfig(
                    system_instruction=SYSTEM_PROMPT,
                ),
                contents=genai_types.Content(
                    role="user",
                    parts=parts
                ),
            )
            return response.text
        else:
            # Old API - limited multimodal support
            # For now, just process text files and describe images
            file_descriptions = []
            for file_item in files:
                if file_item["type"] == "image":
                    file_descriptions.append(f"[Image: {file_item['filename']}]")
                elif file_item["type"] == "text":
                    file_descriptions.append(f"File {file_item['filename']}:\n{file_item['data']}")
            
            full_prompt = f"{message}\n\n" + "\n\n".join(file_descriptions)
            full_prompt_with_system = f"{SYSTEM_PROMPT}\n\n---\n\n{full_prompt}"
            response = self.model.generate_content(full_prompt_with_system)
            return response.text


# ─── AI Client with Fallback ─────────────────────────────────────────────────
class HorusAIClient:
    """
    AI client with automatic fallback.
    
    Strategy: Try Gemini first. If Gemini fails (key missing, quota exceeded,
    API error), automatically fall back to OpenRouter.
    """
    
    def __init__(self):
        self.gemini: Optional[GeminiClient] = None
        self.openrouter: Optional[OpenRouterClient] = None
        self._provider = "none"
        
        # Try to initialize Gemini
        gemini_key = getattr(settings, 'GEMINI_API_KEY', None) or os.getenv('GEMINI_API_KEY')
        if gemini_key and GEMINI_AVAILABLE:
            try:
                self.gemini = GeminiClient()
                self._provider = "gemini"
                logger.info("Primary AI provider: Gemini")
            except Exception as e:
                logger.warning(f"Failed to initialize Gemini: {e}")
        
        # Try to initialize OpenRouter
        openrouter_key = getattr(settings, 'OPENROUTER_API_KEY', None) or os.getenv('OPENROUTER_API_KEY')
        if openrouter_key:
            model = getattr(settings, 'OPENROUTER_MODEL', None) or "google/gemini-2.0-flash-001"
            self.openrouter = OpenRouterClient(api_key=openrouter_key, model=model)
            if self._provider == "none":
                self._provider = "openrouter"
            logger.info(f"Fallback AI provider: OpenRouter ({model})")
        
        if not self.gemini and not self.openrouter:
            raise ValueError(
                "No AI provider configured. Set GEMINI_API_KEY or OPENROUTER_API_KEY in environment variables."
            )
        
        logger.info(f"HorusAI initialized — primary: {'Gemini' if self.gemini else 'OpenRouter'}, "
                     f"fallback: {'OpenRouter' if self.openrouter and self.gemini else 'none'}")
    
    def _call_with_fallback(self, method_name: str, *args, **kwargs) -> str:
        """Call a method on Gemini first, fall back to OpenRouter on failure."""
        last_error = None
        
        # Try Gemini first
        if self.gemini:
            try:
                method = getattr(self.gemini, method_name)
                result = method(*args, **kwargs)
                return result
            except Exception as e:
                last_error = e
                logger.warning(f"Gemini {method_name} failed: {e}. Trying OpenRouter fallback...")
        
        # Fall back to OpenRouter
        if self.openrouter:
            try:
                method = getattr(self.openrouter, method_name)
                result = method(*args, **kwargs)
                logger.info(f"OpenRouter fallback succeeded for {method_name}")
                return result
            except Exception as e:
                last_error = e
                logger.error(f"OpenRouter {method_name} also failed: {e}")
        
        raise Exception(f"All AI providers failed: {str(last_error)}")
    
    # ── Public API (same interface as GeminiClient) ──────────────────────────
    
    def chat(self, messages: List[Dict[str, str]], context: Optional[str] = None) -> str:
        return self._call_with_fallback("chat", messages=messages, context=context)
    
    def generate_text(self, prompt: str, context: Optional[str] = None) -> str:
        return self._call_with_fallback("generate_text", prompt=prompt, context=context)
    
    def summarize(self, content: str, max_length: int = 100) -> str:
        return self._call_with_fallback("summarize", content=content, max_length=max_length)
    
    def generate_comment(self, text: str, focus: Optional[str] = None) -> str:
        return self._call_with_fallback("generate_comment", text=text, focus=focus)
    
    def explain(self, topic: str, level: str = "intermediate") -> str:
        return self._call_with_fallback("explain", topic=topic, level=level)
    
    def extract_evidence(self, text: str, criteria: Optional[str] = None) -> str:
        return self._call_with_fallback("extract_evidence", text=text, criteria=criteria)
    
    def chat_with_files(self, message: str, files: List[Dict]) -> str:
        return self._call_with_fallback("chat_with_files", message=message, files=files)
    
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

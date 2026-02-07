"""Gemini AI service client."""
from app.core.config import settings
import logging
from typing import Optional, List, Dict
import os

logger = logging.getLogger(__name__)

# Try new API first, fallback to old API
try:
    from google import genai as new_genai
    from google.genai import types as genai_types
    USE_NEW_API = True
except ImportError:
    try:
        import google.generativeai as old_genai
        USE_NEW_API = False
    except ImportError:
        raise ImportError("Neither google-genai nor google-generativeai is installed. Run: pip install google-genai")


# ─── Domain-Aware System Prompt ───────────────────────────────────────────────
SYSTEM_PROMPT = """You are **Horus AI**, an expert quality assurance advisor for educational institutions. You are part of the Ayn Platform — a SaaS tool that helps schools, universities, and training centers achieve and maintain accreditation.

Your expertise covers three key frameworks:

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


class GeminiClient:
    """Google Gemini API client."""
    
    def __init__(self):
        """Initialize Gemini client with API key."""
        api_key = getattr(settings, 'GEMINI_API_KEY', None) or os.getenv('GEMINI_API_KEY')
        if not api_key:
            raise ValueError("GEMINI_API_KEY not configured in environment variables. Please add GEMINI_API_KEY to your .env file.")
        
        self.api_key = api_key
        
        if USE_NEW_API:
            self.client = new_genai.Client(api_key=api_key)
            self.model_name = "gemini-2.0-flash-exp"
        else:
            old_genai.configure(api_key=api_key)
            self.model = old_genai.GenerativeModel('gemini-pro')
            self.model_name = "gemini-pro"
            self.client = None
    
    def generate_text(self, prompt: str, context: Optional[str] = None) -> str:
        """
        Generate text using Gemini API with the domain-aware system prompt.
        
        Args:
            prompt: The main prompt/question
            context: Optional additional context
        
        Returns:
            Generated text response
        """
        try:
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
                # Old API: prepend system prompt to the user message
                full_prompt_with_system = f"{SYSTEM_PROMPT}\n\n---\n\n{full_prompt}"
                response = self.model.generate_content(full_prompt_with_system)
                return response.text
        except Exception as e:
            logger.error(f"Error generating text with Gemini: {e}")
            raise Exception(f"Failed to generate text: {str(e)}")
    
    def chat(self, messages: List[Dict[str, str]], context: Optional[str] = None) -> str:
        """
        Multi-turn chat using Gemini API with conversation history.
        
        Args:
            messages: List of {"role": "user"|"assistant", "content": str}
            context: Optional context hint (e.g. "gap_analysis", "evidence_review")
        
        Returns:
            Generated assistant response
        """
        try:
            # Build system instruction with optional context enhancement
            system_instruction = SYSTEM_PROMPT
            if context:
                context_hints = {
                    "evidence_analysis": "\n\nThe user is currently analyzing evidence documents. Focus on evaluating evidence against accreditation criteria.",
                    "gap_analysis": "\n\nThe user is performing a gap analysis. Focus on identifying gaps between current state and standard requirements.",
                    "assessment_help": "\n\nThe user needs help with assessment answers. Guide them to provide comprehensive, evidence-backed responses.",
                    "self_study": "\n\nThe user is preparing a self-study report. Help structure their documentation for accreditation review.",
                }
                system_instruction += context_hints.get(context, f"\n\nAdditional context: {context}")
            
            if USE_NEW_API:
                # Build conversation contents for Gemini
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
                # Old API fallback: concatenate history into a single prompt
                history_text = ""
                for msg in messages[:-1]:
                    role_label = "User" if msg["role"] == "user" else "Assistant"
                    history_text += f"{role_label}: {msg['content']}\n\n"
                
                last_msg = messages[-1]["content"] if messages else ""
                full_prompt = f"{system_instruction}\n\n---\nConversation History:\n{history_text}\nUser: {last_msg}\n\nAssistant:"
                response = self.model.generate_content(full_prompt)
                return response.text
        except Exception as e:
            logger.error(f"Error in chat with Gemini: {e}")
            raise Exception(f"Failed to generate chat response: {str(e)}")
    
    def summarize(self, content: str, max_length: int = 100) -> str:
        """Summarize content using Gemini API."""
        try:
            prompt = f"Summarize the following content in approximately {max_length} words:\n\n{content}"
            if USE_NEW_API:
                response = self.client.models.generate_content(
                    model=self.model_name,
                    config=genai_types.GenerateContentConfig(
                        system_instruction=SYSTEM_PROMPT,
                    ),
                    contents=prompt,
                )
                return response.text
            else:
                response = self.model.generate_content(prompt)
                return response.text
        except Exception as e:
            logger.error(f"Error summarizing with Gemini: {e}")
            raise Exception(f"Failed to summarize: {str(e)}")
    
    def generate_comment(self, text: str, focus: Optional[str] = None) -> str:
        """Generate comments/feedback on text."""
        try:
            focus_part = f" with focus on {focus}" if focus else ""
            prompt = f"Provide constructive comments and feedback on the following text{focus_part}:\n\n{text}"
            if USE_NEW_API:
                response = self.client.models.generate_content(
                    model=self.model_name,
                    config=genai_types.GenerateContentConfig(
                        system_instruction=SYSTEM_PROMPT,
                    ),
                    contents=prompt,
                )
                return response.text
            else:
                response = self.model.generate_content(prompt)
                return response.text
        except Exception as e:
            logger.error(f"Error generating comments with Gemini: {e}")
            raise Exception(f"Failed to generate comments: {str(e)}")
    
    def explain(self, topic: str, level: str = "intermediate") -> str:
        """Explain a topic or concept."""
        try:
            prompt = f"Explain {topic} at a {level} level. Be clear and comprehensive."
            if USE_NEW_API:
                response = self.client.models.generate_content(
                    model=self.model_name,
                    config=genai_types.GenerateContentConfig(
                        system_instruction=SYSTEM_PROMPT,
                    ),
                    contents=prompt,
                )
                return response.text
            else:
                response = self.model.generate_content(prompt)
                return response.text
        except Exception as e:
            logger.error(f"Error explaining with Gemini: {e}")
            raise Exception(f"Failed to explain topic: {str(e)}")
    
    def extract_evidence(self, text: str, criteria: Optional[str] = None) -> str:
        """Extract evidence from text related to criteria."""
        try:
            criteria_part = f" related to: {criteria}" if criteria else ""
            prompt = f"Extract and identify evidence from the following text{criteria_part}. List key points that serve as evidence:\n\n{text}"
            if USE_NEW_API:
                response = self.client.models.generate_content(
                    model=self.model_name,
                    config=genai_types.GenerateContentConfig(
                        system_instruction=SYSTEM_PROMPT,
                    ),
                    contents=prompt,
                )
                return response.text
            else:
                response = self.model.generate_content(prompt)
                return response.text
        except Exception as e:
            logger.error(f"Error extracting evidence with Gemini: {e}")
            raise Exception(f"Failed to extract evidence: {str(e)}")


# Global client instance
_gemini_client: Optional[GeminiClient] = None


def get_gemini_client() -> GeminiClient:
    """Get or create Gemini client instance."""
    global _gemini_client
    if _gemini_client is None:
        _gemini_client = GeminiClient()
    return _gemini_client

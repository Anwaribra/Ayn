"""Gemini AI service client."""
from app.core.config import settings
import logging
from typing import Optional
import os

logger = logging.getLogger(__name__)

# Try new API first, fallback to old API
try:
    from google import genai as new_genai
    USE_NEW_API = True
except ImportError:
    try:
        import google.generativeai as old_genai
        USE_NEW_API = False
    except ImportError:
        raise ImportError("Neither google-genai nor google-generativeai is installed. Run: pip install google-genai")


class GeminiClient:
    """Google Gemini API client."""
    
    def __init__(self):
        """Initialize Gemini client with API key."""
        api_key = getattr(settings, 'GEMINI_API_KEY', None) or os.getenv('GEMINI_API_KEY')
        if not api_key:
            raise ValueError("GEMINI_API_KEY not configured in environment variables. Please add GEMINI_API_KEY to your .env file.")
        
        self.api_key = api_key
        
        if USE_NEW_API:
            # New API: google-genai
            # Client can read from env var or we pass api_key
            self.client = new_genai.Client(api_key=api_key)
            self.model_name = "gemini-2.0-flash-exp"  # or "gemini-2.5-flash" or "gemini-2.5-flash"
        else:
            # Old API: google-generativeai
            old_genai.configure(api_key=api_key)
            self.model = old_genai.GenerativeModel('gemini-pro')
            self.model_name = "gemini-pro"
            self.client = None
    
    def generate_text(self, prompt: str, context: Optional[str] = None) -> str:
        """
        Generate text using Gemini API.
        
        Args:
            prompt: The main prompt/question
            context: Optional additional context
        
        Returns:
            Generated text response
        
        Raises:
            Exception: If API call fails
        """
        try:
            # Combine context and prompt if context provided
            full_prompt = prompt
            if context:
                full_prompt = f"Context: {context}\n\nPrompt: {prompt}"
            
            if USE_NEW_API:
                # New API
                response = self.client.models.generate_content(
                    model=self.model_name,
                    contents=full_prompt
                )
                return response.text
            else:
                # Old API
                response = self.model.generate_content(full_prompt)
                return response.text
        except Exception as e:
            logger.error(f"Error generating text with Gemini: {e}")
            raise Exception(f"Failed to generate text: {str(e)}")
    
    def summarize(self, content: str, max_length: int = 100) -> str:
        """
        Summarize content using Gemini API.
        
        Args:
            content: Content to summarize
            max_length: Maximum length of summary
        
        Returns:
            Summarized text
        """
        try:
            prompt = f"Summarize the following content in approximately {max_length} words:\n\n{content}"
            if USE_NEW_API:
                response = self.client.models.generate_content(
                    model=self.model_name,
                    contents=prompt
                )
                return response.text
            else:
                response = self.model.generate_content(prompt)
                return response.text
        except Exception as e:
            logger.error(f"Error summarizing with Gemini: {e}")
            raise Exception(f"Failed to summarize: {str(e)}")
    
    def generate_comment(self, text: str, focus: Optional[str] = None) -> str:
        """
        Generate comments/feedback on text.
        
        Args:
            text: Text to comment on
            focus: Optional focus area
        
        Returns:
            Generated comments
        """
        try:
            focus_part = f" with focus on {focus}" if focus else ""
            prompt = f"Provide constructive comments and feedback on the following text{focus_part}:\n\n{text}"
            if USE_NEW_API:
                response = self.client.models.generate_content(
                    model=self.model_name,
                    contents=prompt
                )
                return response.text
            else:
                response = self.model.generate_content(prompt)
                return response.text
        except Exception as e:
            logger.error(f"Error generating comments with Gemini: {e}")
            raise Exception(f"Failed to generate comments: {str(e)}")
    
    def explain(self, topic: str, level: str = "intermediate") -> str:
        """
        Explain a topic or concept.
        
        Args:
            topic: Topic to explain
            level: Explanation level (basic, intermediate, advanced)
        
        Returns:
            Explanation text
        """
        try:
            prompt = f"Explain {topic} at a {level} level. Be clear and comprehensive."
            if USE_NEW_API:
                response = self.client.models.generate_content(
                    model=self.model_name,
                    contents=prompt
                )
                return response.text
            else:
                response = self.model.generate_content(prompt)
                return response.text
        except Exception as e:
            logger.error(f"Error explaining with Gemini: {e}")
            raise Exception(f"Failed to explain topic: {str(e)}")
    
    def extract_evidence(self, text: str, criteria: Optional[str] = None) -> str:
        """
        Extract evidence from text related to criteria.
        
        Args:
            text: Text to extract evidence from
            criteria: Optional specific criteria to look for
        
        Returns:
            Extracted evidence
        """
        try:
            criteria_part = f" related to: {criteria}" if criteria else ""
            prompt = f"Extract and identify evidence from the following text{criteria_part}. List key points that serve as evidence:\n\n{text}"
            if USE_NEW_API:
                response = self.client.models.generate_content(
                    model=self.model_name,
                    contents=prompt
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


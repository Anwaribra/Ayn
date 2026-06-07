import os
import json
import logging
import time
from typing import Any, Dict, Optional, Tuple
from pydantic import BaseModel, Field

# Using the recommended google-genai library as per requirements
from google import genai
from google.genai import types

from v2.modules.ai_signals.circuit_breaker import AICircuitBreaker, CircuitState

logger = logging.getLogger(__name__)

class AISignalPayload(BaseModel):
    confidence: float = Field(..., description="Confidence score between 0.0 and 1.0")
    detected_entities: list[str] = Field(default_factory=list, description="Entities or standards detected")
    reasoning: str = Field(..., description="Brief explanation of the AI's reasoning")
    structured_data: Optional[Dict[str, Any]] = Field(None, description="Any extracted structured data")

class AISignalsClient:
    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY")
        if self.api_key:
            self.client = genai.Client(api_key=self.api_key)
        else:
            logger.warning("GEMINI_API_KEY is not set. AISignalsClient will use mock fallbacks.")
            self.client = None
        self.model_name = "gemini-2.5-pro"
        # Instantiate circuit breaker
        self.circuit_breaker = AICircuitBreaker(failure_threshold=3, cooldown_window=30.0)

    async def analyze_document_relevance(
        self, 
        text_content: str, 
        context: str = ""
    ) -> Tuple[AISignalPayload, Dict[str, Any]]:
        """
        Analyzes document text and returns a structured AI Signal payload alongside execution metadata.
        Supports seamless mock fallbacks when API key is missing.
        """
        prompt = f"""
        Analyze the following document content for relevance to organizational standards and compliance.
        Context: {context}
        
        Document Content:
        {text_content[:15000]}
        """
        
        start_time = time.time()
        
        # Check circuit breaker
        if not self.circuit_breaker.allow_request():
            latency_ms = int((time.time() - start_time) * 1000)
            fallback_payload = AISignalPayload(
                confidence=0.0,
                detected_entities=[],
                reasoning="AI provider circuit breaker open. Degraded fallback active.",
            )
            metadata = {
                "prompt": prompt,
                "raw_response": "{\"error\": \"circuit breaker open\"}",
                "model": self.model_name,
                "latency_ms": latency_ms,
                "token_usage": {"input_tokens": 0, "output_tokens": 0},
                "estimated_cost": 0.0
            }
            logger.warning("[AISignalsClient] Request blocked: AI provider circuit breaker is OPEN.")
            return fallback_payload, metadata

        # If API key is missing or we are in a test context without a key, return mock data
        if not self.client:
            latency_ms = int((time.time() - start_time) * 1000)
            mock_payload = AISignalPayload(
                confidence=0.85,
                detected_entities=["ISO 21001", "Quality Assurance"],
                reasoning="Mock analysis: The text mentions annual QA reviews and director approval.",
                structured_data={"policy_code": "1.1", "annual_review": True}
            )
            metadata = {
                "prompt": prompt,
                "raw_response": mock_payload.model_dump_json(),
                "model": "mock-gemini-2.5-pro",
                "latency_ms": latency_ms,
                "token_usage": {"input_tokens": 120, "output_tokens": 45},
                "estimated_cost": 0.0005
            }
            # Record success for mock calls so circuit breaker behaves normally
            self.circuit_breaker.record_success()
            return mock_payload, metadata

        try:
            # We block synchronously in the threadpool if using synchronous SDK (google-genai)
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=AISignalPayload,
                    temperature=0.1,
                ),
            )
            
            latency_ms = int((time.time() - start_time) * 1000)
            data = json.loads(response.text)
            payload = AISignalPayload(**data)
            
            # Extract token usage if available in response
            input_tokens = 0
            output_tokens = 0
            if response.usage_metadata:
                input_tokens = response.usage_metadata.prompt_token_count
                output_tokens = response.usage_metadata.candidates_token_count
                
            # Basic cost calculation for gemini-2.5-pro
            # input: $0.00125 / 1k, output: $0.00375 / 1k
            estimated_cost = ((input_tokens / 1000) * 0.00125) + ((output_tokens / 1000) * 0.00375)

            metadata = {
                "prompt": prompt,
                "raw_response": response.text,
                "model": self.model_name,
                "latency_ms": latency_ms,
                "token_usage": {"input_tokens": input_tokens, "output_tokens": output_tokens},
                "estimated_cost": estimated_cost
            }
            
            self.circuit_breaker.record_success()
            return payload, metadata
            
        except Exception as e:
            logger.error(f"Error calling Gemini API: {e}")
            self.circuit_breaker.record_failure()
            latency_ms = int((time.time() - start_time) * 1000)
            fallback_payload = AISignalPayload(
                confidence=0.0,
                detected_entities=[],
                reasoning=f"Error generating AI signal: {str(e)}",
            )
            metadata = {
                "prompt": prompt,
                "raw_response": f"{{\"error\": \"{str(e)}\"}}",
                "model": self.model_name,
                "latency_ms": latency_ms,
                "token_usage": {"input_tokens": 0, "output_tokens": 0},
                "estimated_cost": 0.0
            }
            return fallback_payload, metadata

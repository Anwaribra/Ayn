"""Application configuration settings."""
from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # Database
    DATABASE_URL: str
    DIRECT_URL: Optional[str] = None
    
    # JWT
    JWT_SECRET: str
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    # Supabase
    SUPABASE_URL: str
    SUPABASE_KEY: str
    SUPABASE_SERVICE_KEY: Optional[str] = None
    SUPABASE_BUCKET: str = "evidence"
    
    # Gemini AI
    GEMINI_API_KEY: Optional[str] = None
    GEMINI_MODEL: str = "gemini-2.0-flash"
    
    # OpenRouter (fallback AI provider)
    OPENROUTER_API_KEY: Optional[str] = None
    OPENROUTER_MODEL: str = "openrouter/free"
    
    # OpenAI (speech-to-text)
    OPENAI_API_KEY: Optional[str] = None
    OPENAI_TRANSCRIBE_MODEL: str = "gpt-4o-mini-transcribe"

    # Dify (optional - production-ready RAG + Agent platform)
    DIFY_API_KEY: Optional[str] = None
    DIFY_BASE_URL: Optional[str] = None  # e.g. https://api.dify.ai/v1

    # DeepAgents (optional - experimental deep research path)
    DEEPAGENTS_ENABLED: bool = False
    DEEPAGENTS_API_KEY: Optional[str] = None
    DEEPAGENTS_BASE_URL: Optional[str] = None
    DEEPAGENTS_MODEL: str = "openai/gpt-4o-mini"
    DEEPAGENTS_SYSTEM_PROMPT: str = (
        "You are Horus Deep Research, an experimental research planner for the Ayn platform. "
        "Use provided institution context, stay evidence-first, and never perform destructive "
        "or mutating actions."
    )

    # Google OAuth
    GOOGLE_CLIENT_ID: Optional[str] = None
    GOOGLE_CLIENT_SECRET: Optional[str] = None
    GOOGLE_ALLOWED_DOMAINS: Optional[str] = None
    FRONTEND_URL: str = "https://ayn.vercel.app"
    
    # Application
    APP_NAME: str = "Ayn Platform"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    # Requires DEBUG=True and ENABLE_DEBUG_ENDPOINTS=True to expose debug-only routes.
    ENABLE_DEBUG_ENDPOINTS: bool = False
    
    # CORS (comma-separated string, will be parsed)
    CORS_ORIGINS: str = "http://localhost:3000,http://localhost:5173"
    
    model_config = {
        "env_file": ".env",
        "case_sensitive": True,
        "extra": "ignore"
    }

    @property
    def cors_origins_list(self) -> list[str]:
        """Parse CORS origins from comma-separated string."""
        # Split and clean origins
        origins = [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]
        # Ensure common localhost variants are included
        defaults = [
            "http://localhost:3000",
            "http://localhost:3001",
            "http://localhost:3004",
            "http://127.0.0.1:3000",
            "http://127.0.0.1:3001",
            "http://127.0.0.1:3004",
            # Production frontend
            "https://ayn.vercel.app",
        ]
        for d in defaults:
            if d not in origins:
                origins.append(d)
        return origins


settings = Settings()

"""Authentication service."""
from fastapi import HTTPException, status
from app.core.db import get_db
from app.core.utils import get_password_hash, verify_password, create_access_token
from app.auth.models import (
    RegisterRequest,
    LoginRequest,
    UpdateUserRequest,
    AuthResponse,
    UserResponse,
)
from app.auth.google_utils import verify_google_id_token
from app.core.config import settings
from supabase import create_client, Client
import logging

logger = logging.getLogger(__name__)

class AuthService:
    """Service for authentication logic."""
    
    @staticmethod
    async def register(body: RegisterRequest) -> AuthResponse:
        """Register a new user."""
        db = get_db()
        
        # Valid roles (expanded list)
        role = None
        if body.role:
            role_candidate = body.role.strip().upper()
            valid_roles = ["ADMIN", "TEACHER", "AUDITOR", "STUDENT", "UNIVERSITY", "INSTITUTION", "OTHER"]
            if role_candidate in valid_roles:
                role = role_candidate
        
        # Check if user already exists
        existing_user = await db.user.find_unique(where={"email": body.email})
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        # Validate institution if provided
        if body.institutionId:
            institution = await db.institution.find_unique(where={"id": body.institutionId})
            if not institution:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Institution not found"
                )
        
        # Hash password
        hashed_password = get_password_hash(body.password)
        
        # Create user
        try:
            user = await db.user.create(
                data={
                    "name": body.name,
                    "email": body.email,
                    "password": hashed_password,
                    "role": role,
                    "institutionId": body.institutionId,
                }
            )
            
            # Create access token
            access_token = create_access_token(data={"sub": user.id, "role": user.role})
            
            return AuthResponse(
                user=UserResponse.model_validate(user),
                access_token=access_token
            )
        except Exception as e:
            logger.exception("Error creating user")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create user"
            )

    @staticmethod
    async def login(body: LoginRequest) -> AuthResponse:
        """Login user and return access token."""
        db = get_db()
        
        user = await db.user.find_unique(where={"email": body.email})
        
        if not user or not verify_password(body.password, user.password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        access_token = create_access_token(data={"sub": user.id, "role": user.role})
        
        return AuthResponse(
            user=UserResponse.model_validate(user),
            access_token=access_token
        )

    @staticmethod
    async def login_with_google(id_token: str) -> AuthResponse:
        """Login or register a user using a Google ID token."""
        db = get_db()

        payload = verify_google_id_token(id_token)
        email = payload.get("email")
        name = payload.get("name") or email

        if not email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Google account does not have a verified email.",
            )

        user = await db.user.find_unique(where={"email": email})

        if not user:
            placeholder_password = get_password_hash("google-oauth-user")
            try:
                user = await db.user.create(
                    data={
                        "name": name,
                        "email": email,
                        "password": placeholder_password,
                        "role": None,
                    }
                )
            except Exception as e:
                logger.error(f"Error creating Google user: {e}")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Failed to create user from Google account.",
                )

        access_token = create_access_token(data={"sub": user.id, "role": user.role})

        return AuthResponse(
            user=UserResponse.model_validate(user),
            access_token=access_token
        )

    @staticmethod
    async def sync_with_supabase(access_token: str) -> AuthResponse:
        """Verify a Supabase access token and return a local access token."""
        logger.info("[Supabase Sync] Starting Supabase token verification...")
        db = get_db()
        
        try:
            key = settings.SUPABASE_SERVICE_KEY or settings.SUPABASE_KEY
            logger.info(f"[Supabase Sync] Using {'SERVICE_KEY' if settings.SUPABASE_SERVICE_KEY else 'ANON_KEY'}")
            supabase: Client = create_client(settings.SUPABASE_URL, key)
            
            res = supabase.auth.get_user(access_token)
            if not res or not res.user:
                logger.error("[Supabase Sync] Invalid token - no user returned")
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid Supabase token"
                )
            
            supabase_user = res.user
            email = supabase_user.email
            name = supabase_user.user_metadata.get("full_name") or email
            logger.info(f"[Supabase Sync] Token verified for user: {email}")
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"[Supabase Sync] Verification error: {e}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Failed to verify Supabase token: {str(e)}"
            )

        user = await db.user.find_unique(where={"email": email})

        if not user:
            logger.info(f"[Supabase Sync] User not found, creating new user...")
            placeholder_password = get_password_hash("supabase-oauth-user")

            try:
                user = await db.user.create(
                    data={
                        "name": name,
                        "email": email,
                        "password": placeholder_password,
                        "role": None,
                    }
                )
                logger.info(f"[Supabase Sync] User created successfully: {user.id}")
            except Exception as e:
                logger.error(f"[Supabase Sync] Error creating user: {e}")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Failed to create user from Supabase account.",
                )

        local_access_token = create_access_token(data={"sub": user.id, "role": user.role})
        
        return AuthResponse(
            user=UserResponse.model_validate(user),
            access_token=local_access_token
        )

    @staticmethod
    async def get_user_by_id(user_id: str) -> UserResponse:
        """Get user by ID."""
        db = get_db()
        user = await db.user.find_unique(where={"id": user_id})
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        return UserResponse.model_validate(user)

    @staticmethod
    async def update_user(user_id: str, body: UpdateUserRequest) -> UserResponse:
        """Update user profile."""
        db = get_db()
        
        if body.name is None:
            return await AuthService.get_user_by_id(user_id)

        try:
            updated = await db.user.update(
                where={"id": user_id},
                data={"name": body.name},
            )
            return UserResponse.model_validate(updated)
        except Exception as e:
            logger.error(f"Error updating user: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update user"
            )

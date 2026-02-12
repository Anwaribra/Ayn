"""Authentication router."""
from fastapi import APIRouter, status, Depends, Request
from app.auth.models import (
    RegisterRequest,
    LoginRequest,
    GoogleLoginRequest,
    SupabaseLoginRequest,
    UpdateUserRequest,
    AuthResponse,
    UserResponse,
    LogoutResponse,
)
from app.auth.service import AuthService
from app.core.middlewares import get_current_user
from app.core.rate_limit import limiter
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("5/minute")
async def register(request: Request, body: RegisterRequest):
    """
    Register a new user.
    """
    return await AuthService.register(body)


@router.post("/login", response_model=AuthResponse)
@limiter.limit("10/minute")
async def login(request: Request, body: LoginRequest):
    """
    Login user and return access token.
    """
    return await AuthService.login(body)


@router.post("/google", response_model=AuthResponse)
@limiter.limit("5/minute")
async def login_with_google(request: Request, body: GoogleLoginRequest):
    """
    Login or register a user using a Google ID token.
    """
    return await AuthService.login_with_google(body.id_token)


@router.post("/supabase-sync", response_model=AuthResponse)
@limiter.limit("5/minute")
async def login_with_supabase(request: Request, body: SupabaseLoginRequest):
    """
    Verify a Supabase access token and return a local access token.
    Used for Google login via Supabase.
    """
    return await AuthService.sync_with_supabase(body.access_token)


@router.post("/logout", response_model=LogoutResponse)
async def logout(current_user: dict = Depends(get_current_user)):
    """
    Logout user.
    """
    logger.info(f"User {current_user['email']} logged out")
    return LogoutResponse(message="Successfully logged out")


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: dict = Depends(get_current_user)):
    """
    Get current authenticated user information.
    """
    return await AuthService.get_user_by_id(current_user["id"])


@router.patch("/me", response_model=UserResponse)
async def update_current_user(
    body: UpdateUserRequest,
    current_user: dict = Depends(get_current_user),
):
    """
    Update current user profile (name).
    """
    return await AuthService.update_user(current_user["id"], body)

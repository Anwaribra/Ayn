"""Authentication router."""
from fastapi import APIRouter, status, Depends, Request, Response, HTTPException
from app.auth.models import (
    RegisterRequest,
    LoginRequest,
    GoogleLoginRequest,
    SupabaseLoginRequest,
    GoogleOAuthCallbackRequest,
    UpdateUserRequest,
    AuthResponse,
    UserResponse,
    LogoutResponse,
)
from app.auth.service import AuthService
from app.core.config import settings
from app.core.middlewares import get_current_user
from app.core.rate_limit import limiter
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


def _set_session_cookie(response: Response, access_token: str) -> None:
    response.set_cookie(
        key="ayn_session",
        value=access_token,
        httponly=True,
        secure=not settings.DEBUG,
        samesite="lax",
        max_age=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        path="/",
    )


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("5/minute")
async def register(request: Request, response: Response, body: RegisterRequest):
    """
    Register a new user.
    """
    auth = await AuthService.register(body)
    _set_session_cookie(response, auth.access_token)
    auth.access_token = ""
    return auth


@router.post("/login", response_model=AuthResponse)
@limiter.limit("10/minute")
async def login(request: Request, response: Response, body: LoginRequest):
    """
    Login user and return access token.
    """
    auth = await AuthService.login(body)
    _set_session_cookie(response, auth.access_token)
    auth.access_token = ""
    return auth


@router.post("/google", response_model=AuthResponse)
@limiter.limit("5/minute")
async def login_with_google(request: Request, response: Response, body: GoogleLoginRequest):
    """
    Login or register a user using a Google ID token.
    """
    auth = await AuthService.login_with_google(body.id_token)
    _set_session_cookie(response, auth.access_token)
    auth.access_token = ""
    return auth


@router.post("/google/callback", response_model=AuthResponse)
@limiter.limit("10/minute")
async def google_oauth_callback(request: Request, response: Response, body: GoogleOAuthCallbackRequest):
    """
    Exchange Google OAuth authorization code for tokens.
    Used when redirect_uri is the frontend (ayn.vercel.app) so Google shows that domain.
    """
    auth = await AuthService.google_oauth_callback(body.code, body.redirect_uri)
    _set_session_cookie(response, auth.access_token)
    auth.access_token = ""
    return auth


@router.post("/supabase-sync", response_model=AuthResponse)
@limiter.limit("5/minute")
async def login_with_supabase(request: Request, response: Response, body: SupabaseLoginRequest):
    """
    Verify a Supabase access token and return a local access token.
    Used for Google login via Supabase.
    """
    auth = await AuthService.sync_with_supabase(body.access_token)
    _set_session_cookie(response, auth.access_token)
    auth.access_token = ""
    return auth


@router.post("/logout", response_model=LogoutResponse)
async def logout(response: Response, current_user: dict = Depends(get_current_user)):
    """
    Logout user.
    """
    logger.info(f"User {current_user['email']} logged out")
    response.delete_cookie("ayn_session", path="/")
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


@router.post("/setup-institution", status_code=status.HTTP_200_OK)
async def setup_institution(current_user: dict = Depends(get_current_user)):
    """
    Auto-setup a default institution for the logged-in user if they don't have one.
    """
    from app.core.db import get_db
    db = get_db()
    
    user_id = current_user["id"]
    user = await db.user.find_unique(where={"id": user_id}, include={"institution": True})
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if user.institutionId:
        return {"message": "Institution already setup", "institution": user.institution}
        
    default_institution = await db.institution.create(
        data={
            "name": f"{user.name}'s Institution",
        }
    )
    user = await db.user.update(
        where={"id": user.id},
        data={"institutionId": default_institution.id}
    )
    
    return {"message": "Institution created", "institution": default_institution}


from app.auth.preferences import PreferencesService

@router.get("/preferences")
async def get_preferences(current_user: dict = Depends(get_current_user)):
    return await PreferencesService.get_preferences(current_user["id"])

@router.put("/preferences")
async def save_preferences(request: Request, current_user: dict = Depends(get_current_user)):
    body = await request.json()
    return await PreferencesService.save_preferences(current_user["id"], body)

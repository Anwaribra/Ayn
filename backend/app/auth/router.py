"""Authentication router."""
from fastapi import APIRouter, HTTPException, status, Depends, Request
from app.core.db import get_db
from app.core.rate_limit import limiter
from app.core.utils import get_password_hash, verify_password, create_access_token
from app.auth.models import (
    RegisterRequest,
    LoginRequest,
    GoogleLoginRequest,
    SupabaseLoginRequest,
    AuthResponse,
    UserResponse,
    LogoutResponse,
)
from app.core.middlewares import get_current_user
from app.auth.google_utils import verify_google_id_token
from app.core.config import settings
from supabase import create_client, Client
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("5/minute")
async def register(req: Request, request: RegisterRequest):
    """
    Register a new user.
    
    - **name**: User's full name
    - **email**: User's email (must be unique)
    - **password**: User's password (min 8 characters)
    - **role**: User role (ADMIN, TEACHER, or AUDITOR)
    - **institutionId**: Optional institution ID
    """
    db = get_db()
    
    # Default to TEACHER (regular user) for platform users; only ADMIN is set separately
    role = (request.role or "TEACHER").strip().upper()
    valid_roles = ["ADMIN", "TEACHER", "AUDITOR"]
    if role not in valid_roles:
        role = "TEACHER"
    
    # Check if user already exists
    existing_user = await db.user.find_unique(where={"email": request.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Validate institution if provided
    if request.institutionId:
        institution = await db.institution.find_unique(where={"id": request.institutionId})
        if not institution:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Institution not found"
            )
    
    # Hash password
    hashed_password = get_password_hash(request.password)
    
    # Create user
    try:
        user = await db.user.create(
            data={
                "name": request.name,
                "email": request.email,
                "password": hashed_password,
                "role": role,
                "institutionId": request.institutionId,
            }
        )
        
        # Create access token
        access_token = create_access_token(data={"sub": user.id, "role": user.role})
        
        # Return user info and token
        return AuthResponse(
            user=UserResponse(
                id=user.id,
                name=user.name,
                email=user.email,
                role=user.role,
                institutionId=user.institutionId,
                createdAt=user.createdAt
            ),
            access_token=access_token
        )
    except Exception as e:
        logger.exception("Error creating user")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create user"
        )


@router.post("/login", response_model=AuthResponse)
@limiter.limit("10/minute")
async def login(req: Request, request: LoginRequest):
    """
    Login user and return access token.
    
    - **email**: User's email
    - **password**: User's password
    """
    db = get_db()
    
    # Find user by email
    user = await db.user.find_unique(where={"email": request.email})
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Verify password
    if not verify_password(request.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create access token
    access_token = create_access_token(data={"sub": user.id, "role": user.role})
    
    # Return user info and token
    return AuthResponse(
        user=UserResponse(
            id=user.id,
            name=user.name,
            email=user.email,
            role=user.role,
            institutionId=user.institutionId,
            createdAt=user.createdAt
        ),
        access_token=access_token
    )


@router.post("/google", response_model=AuthResponse)
async def login_with_google(request: GoogleLoginRequest):
    """
    Login or register a user using a Google ID token.

    - **id_token**: Google ID token obtained from Google Identity Services
    """
    db = get_db()

    # Verify Google token and extract user info
    payload = verify_google_id_token(request.id_token)
    email = payload.get("email")
    name = payload.get("name") or email

    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Google account does not have a verified email.",
        )

    # Find existing user or create a new one
    user = await db.user.find_unique(where={"email": email})

    if not user:
        # Create a placeholder password since the field is required in the schema
        placeholder_password = get_password_hash("google-oauth-user")

        try:
            user = await db.user.create(
                data={
                    "name": name,
                    "email": email,
                    "password": placeholder_password,
                    "role": "TEACHER",  # Default role for Google sign-in users
                }
            )
        except Exception as e:
            logger.error(f"Error creating Google user: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create user from Google account.",
            )

    # Create access token
    access_token = create_access_token(data={"sub": user.id, "role": user.role})

    return AuthResponse(
        user=UserResponse(
            id=user.id,
            name=user.name,
            email=user.email,
            role=user.role,
            institutionId=user.institutionId,
            createdAt=user.createdAt
        ),
        access_token=access_token
    )


@router.post("/supabase-sync", response_model=AuthResponse)
async def login_with_supabase(request: SupabaseLoginRequest):
    """
    Verify a Supabase access token and return a local access token.
    Used for Google login via Supabase.
    """
    logger.info("[Supabase Sync] Starting Supabase token verification...")
    db = get_db()
    
    # Initialize Supabase client
    try:
        # Use Service Key for backend verification as it's more reliable
        key = settings.SUPABASE_SERVICE_KEY or settings.SUPABASE_KEY
        logger.info(f"[Supabase Sync] Using {'SERVICE_KEY' if settings.SUPABASE_SERVICE_KEY else 'ANON_KEY'}")
        supabase: Client = create_client(settings.SUPABASE_URL, key)
        
        # Verify the token by calling auth.get_user()
        logger.info("[Supabase Sync] Verifying token with Supabase...")
        res = supabase.auth.get_user(request.access_token)
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

    # Find existing user or create a new one
    logger.info(f"[Supabase Sync] Looking for existing user with email: {email}")
    user = await db.user.find_unique(where={"email": email})

    if not user:
        logger.info(f"[Supabase Sync] User not found, creating new user...")
        # Create a placeholder password
        placeholder_password = get_password_hash("supabase-oauth-user")

        try:
            user = await db.user.create(
                data={
                    "name": name,
                    "email": email,
                    "password": placeholder_password,
                    "role": "TEACHER",  # Default role
                }
            )
            logger.info(f"[Supabase Sync] User created successfully: {user.id}")
        except Exception as e:
            logger.error(f"[Supabase Sync] Error creating user: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create user from Supabase account.",
            )
    else:
        logger.info(f"[Supabase Sync] Existing user found: {user.id}")

    # Create local access token
    access_token = create_access_token(data={"sub": user.id, "role": user.role})
    logger.info(f"[Supabase Sync] Access token created for user: {user.id}")

    return AuthResponse(
        user=UserResponse(
            id=user.id,
            name=user.name,
            email=user.email,
            role=user.role,
            institutionId=user.institutionId,
            createdAt=user.createdAt
        ),
        access_token=access_token
    )


@router.post("/logout", response_model=LogoutResponse)
async def logout(current_user: dict = Depends(get_current_user)):
    """
    Logout user.
    
    Note: Since we're using stateless JWT tokens, logout is handled client-side
    by removing the token. This endpoint exists for consistency and can be used
    for logging/logout tracking.
    """
    logger.info(f"User {current_user['email']} logged out")
    return LogoutResponse(message="Successfully logged out")


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: dict = Depends(get_current_user)):
    """
    Get current authenticated user information.
    """
    db = get_db()
    user = await db.user.find_unique(where={"id": current_user["id"]})
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return UserResponse(
        id=user.id,
        name=user.name,
        email=user.email,
        role=user.role,
        institutionId=user.institutionId,
        createdAt=user.createdAt
    )

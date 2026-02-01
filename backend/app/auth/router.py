"""Authentication router."""
from fastapi import APIRouter, HTTPException, status, Depends
from app.core.db import get_db
from app.core.utils import get_password_hash, verify_password, create_access_token
from app.auth.models import (
    RegisterRequest,
    LoginRequest,
    GoogleLoginRequest,
    AuthResponse,
    UserResponse,
    LogoutResponse,
)
from app.core.middlewares import get_current_user
from app.auth.google_utils import verify_google_id_token
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def register(request: RegisterRequest):
    """
    Register a new user.
    
    - **name**: User's full name
    - **email**: User's email (must be unique)
    - **password**: User's password (min 8 characters)
    - **role**: User role (ADMIN, TEACHER, or AUDITOR)
    - **institutionId**: Optional institution ID
    """
    db = get_db()
    
    # Validate role
    valid_roles = ["ADMIN", "TEACHER", "AUDITOR"]
    if request.role.upper() not in valid_roles:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid role. Must be one of: {', '.join(valid_roles)}"
        )
    
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
                "role": request.role.upper(),
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
        logger.error(f"Error creating user: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create user"
        )


@router.post("/login", response_model=AuthResponse)
async def login(request: LoginRequest):
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

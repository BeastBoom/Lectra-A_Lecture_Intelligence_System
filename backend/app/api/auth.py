"""
Auth API — register / login / me endpoints with JWT tokens.
"""
from __future__ import annotations

import os
import uuid
from datetime import datetime, timezone, timedelta

from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session

from app.configs import DATABASE_URL
from app.db.models import User

import hashlib
import hmac
import base64
import json

router = APIRouter()
_engine = create_engine(DATABASE_URL)

# ── JWT Settings ─────────────────────────────────────────────────────────────
JWT_SECRET = os.getenv("JWT_SECRET", "lectra-dev-secret-change-in-production")
JWT_ALGORITHM = "HS256"
JWT_EXPIRE_HOURS = 24

security = HTTPBearer(auto_error=False)


# ── Password hashing (stdlib-only, no bcrypt dependency) ─────────────────────
def _hash_password(password: str) -> str:
    """Hash password using PBKDF2-HMAC-SHA256 (stdlib)."""
    salt = os.urandom(16)
    dk = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, 100_000)
    return base64.b64encode(salt + dk).decode()


def _verify_password(password: str, stored: str) -> bool:
    """Verify password against stored PBKDF2 hash."""
    decoded = base64.b64decode(stored.encode())
    salt = decoded[:16]
    stored_dk = decoded[16:]
    dk = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, 100_000)
    return hmac.compare_digest(dk, stored_dk)


# ── Minimal JWT (stdlib, no PyJWT dependency) ─────────────────────────────────
def _b64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode()


def _b64url_decode(s: str) -> bytes:
    s += "=" * (4 - len(s) % 4)
    return base64.urlsafe_b64decode(s)


def _create_jwt(payload: dict) -> str:
    header = {"alg": JWT_ALGORITHM, "typ": "JWT"}
    h = _b64url_encode(json.dumps(header).encode())
    p = _b64url_encode(json.dumps(payload, default=str).encode())
    sig = hmac.new(JWT_SECRET.encode(), f"{h}.{p}".encode(), hashlib.sha256).digest()
    return f"{h}.{p}.{_b64url_encode(sig)}"


def _decode_jwt(token: str) -> dict | None:
    try:
        parts = token.split(".")
        if len(parts) != 3:
            return None
        h, p, s = parts
        sig = hmac.new(JWT_SECRET.encode(), f"{h}.{p}".encode(), hashlib.sha256).digest()
        if not hmac.compare_digest(sig, _b64url_decode(s)):
            return None
        payload = json.loads(_b64url_decode(p))
        # Check expiry
        exp = payload.get("exp")
        if exp and datetime.fromisoformat(exp) < datetime.now(timezone.utc):
            return None
        return payload
    except Exception:
        return None


# ── Schemas ──────────────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    email: str
    password: str
    full_name: str


class LoginRequest(BaseModel):
    email: str
    password: str


class AuthResponse(BaseModel):
    token: str
    user: dict


# ── Helpers ──────────────────────────────────────────────────────────────────

def _user_dict(u: User) -> dict:
    return {
        "id": str(u.id),
        "email": u.email,
        "full_name": u.full_name,
        "provider": u.provider,
        "created_at": u.created_at.isoformat() if u.created_at else None,
    }


def _make_token(user: User) -> str:
    return _create_jwt({
        "sub": str(user.id),
        "email": user.email,
        "exp": (datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRE_HOURS)).isoformat(),
    })


def get_current_user(creds: HTTPAuthorizationCredentials | None = Depends(security)):
    """Dependency: extract current user from JWT Bearer token."""
    if creds is None:
        raise HTTPException(status_code=401, detail="Not authenticated")
    payload = _decode_jwt(creds.credentials)
    if payload is None:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    with Session(_engine) as session:
        user = session.get(User, uuid.UUID(payload["sub"]))
        if user is None:
            raise HTTPException(status_code=401, detail="User not found")
        return _user_dict(user)


# ── Routes ───────────────────────────────────────────────────────────────────

@router.post("/auth/register")
async def register(body: RegisterRequest):
    """Create a new user account with email + password."""
    with Session(_engine) as session:
        existing = session.execute(
            select(User).where(User.email == body.email.lower().strip())
        ).scalar_one_or_none()
        if existing:
            raise HTTPException(status_code=409, detail="An account with this email already exists")

        user = User(
            email=body.email.lower().strip(),
            hashed_password=_hash_password(body.password),
            full_name=body.full_name.strip(),
            provider="email",
        )
        session.add(user)
        session.commit()
        session.refresh(user)

        return {"token": _make_token(user), "user": _user_dict(user)}


@router.post("/auth/login")
async def login(body: LoginRequest):
    """Log in with email + password, returns a JWT."""
    with Session(_engine) as session:
        user = session.execute(
            select(User).where(User.email == body.email.lower().strip())
        ).scalar_one_or_none()

        if not user or not user.hashed_password:
            raise HTTPException(status_code=401, detail="Invalid email or password")

        if not _verify_password(body.password, user.hashed_password):
            raise HTTPException(status_code=401, detail="Invalid email or password")

        return {"token": _make_token(user), "user": _user_dict(user)}


@router.get("/auth/me")
async def me(current_user: dict = Depends(get_current_user)):
    """Return the current authenticated user."""
    return {"user": current_user}


@router.get("/auth/google/callback")
async def google_callback(code: str):
    """
    Google OAuth callback — exchange auth code for token, fetch user info,
    create-or-find the user, and return a Lectra JWT.
    """
    from app.configs import GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI
    import httpx

    # 1. Exchange authorization code for access token
    token_url = "https://oauth2.googleapis.com/token"
    token_data = {
        "code": code,
        "client_id": GOOGLE_CLIENT_ID,
        "client_secret": GOOGLE_CLIENT_SECRET,
        "redirect_uri": GOOGLE_REDIRECT_URI,
        "grant_type": "authorization_code",
    }

    import logging
    logger = logging.getLogger(__name__)
    logger.info(f"[Google OAuth] Exchanging code, redirect_uri={GOOGLE_REDIRECT_URI}")

    async with httpx.AsyncClient() as client:
        token_res = await client.post(token_url, data=token_data)
        logger.info(f"[Google OAuth] Token response status={token_res.status_code}")
        if token_res.status_code != 200:
            logger.error(f"[Google OAuth] Token exchange failed: {token_res.text}")
            raise HTTPException(
                status_code=400,
                detail=f"Failed to exchange code with Google: {token_res.text}",
            )
        token_json = token_res.json()
        access_token = token_json.get("access_token")
        if not access_token:
            raise HTTPException(status_code=400, detail="No access token from Google")

        # 2. Fetch user info from Google
        userinfo_res = await client.get(
            "https://www.googleapis.com/oauth2/v2/userinfo",
            headers={"Authorization": f"Bearer {access_token}"},
        )
        if userinfo_res.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to fetch Google user info")
        userinfo = userinfo_res.json()

    google_email = userinfo.get("email", "").lower().strip()
    google_name = userinfo.get("name", "")

    if not google_email:
        raise HTTPException(status_code=400, detail="Google account has no email")

    # 3. Find or create user
    with Session(_engine) as session:
        user = session.execute(
            select(User).where(User.email == google_email)
        ).scalar_one_or_none()

        if user is None:
            # Create new Google user
            user = User(
                email=google_email,
                full_name=google_name,
                provider="google",
                hashed_password=None,
            )
            session.add(user)
            session.commit()
            session.refresh(user)

        return {"token": _make_token(user), "user": _user_dict(user)}


# ── OTP-Based Password Reset ─────────────────────────────────────────────────

import random
import threading

# In-memory OTP store: { email: { "otp": "123456", "user_id": "...", "expires": datetime } }
_otp_store: dict = {}
_otp_lock = threading.Lock()


class ForgotPasswordRequest(BaseModel):
    email: str


class VerifyOtpRequest(BaseModel):
    email: str
    otp: str


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str


def _send_otp_email(to_email: str, otp: str):
    """Send password reset OTP via SMTP."""
    from app.configs import SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM
    import smtplib
    from email.mime.text import MIMEText
    from email.mime.multipart import MIMEMultipart
    import logging

    logger = logging.getLogger(__name__)

    if not SMTP_USER or not SMTP_PASS:
        logger.warning(f"[Password Reset] SMTP not configured. OTP for {to_email}: {otp}")
        return

    msg = MIMEMultipart("alternative")
    msg["Subject"] = "Lectra — Your Password Reset Code"
    msg["From"] = SMTP_FROM
    msg["To"] = to_email

    html = f"""
    <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:40px 24px;background:#0d1117;border-radius:16px;">
      <h1 style="color:#39d98a;font-size:28px;margin-bottom:8px;">Lectra</h1>
      <h2 style="color:#e6edf3;font-size:20px;margin-bottom:16px;">Password Reset Code</h2>
      <p style="color:#8b949e;font-size:14px;line-height:1.6;margin-bottom:24px;">
        Use the following code to reset your password. This code expires in <strong>10 minutes</strong>.
      </p>
      <div style="background:#161b22;border:2px solid #39d98a;border-radius:12px;padding:20px;text-align:center;margin-bottom:24px;">
        <span style="font-family:monospace;font-size:36px;font-weight:bold;color:#39d98a;letter-spacing:8px;">{otp}</span>
      </div>
      <p style="color:#8b949e;font-size:12px;line-height:1.5;">
        If you didn't request this, you can safely ignore this email.
      </p>
    </div>
    """

    msg.attach(MIMEText(html, "html"))

    try:
        if SMTP_PORT == 465:
            with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT) as server:
                server.login(SMTP_USER, SMTP_PASS)
                server.sendmail(SMTP_FROM, to_email, msg.as_string())
        else:
            with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
                server.starttls()
                server.login(SMTP_USER, SMTP_PASS)
                server.sendmail(SMTP_FROM, to_email, msg.as_string())
        logger.info(f"[Password Reset] OTP email sent to {to_email}")
    except Exception as exc:
        logger.error(f"[Password Reset] Failed to send OTP email: {exc}")
        logger.info(f"[Password Reset] Fallback — OTP for {to_email}: {otp}")


# ── Password Reset Routes ────────────────────────────────────────────────────

@router.post("/auth/forgot-password")
async def forgot_password(body: ForgotPasswordRequest):
    """Generate a 6-digit OTP and email it to the user."""
    import logging
    logger = logging.getLogger(__name__)

    email = body.email.lower().strip()

    with Session(_engine) as session:
        user = session.execute(
            select(User).where(User.email == email)
        ).scalar_one_or_none()

    # Always return success to prevent email enumeration
    if not user:
        logger.info(f"[Password Reset] No account found for {email}, returning success anyway")
        return {"message": "If an account with that email exists, a reset code has been sent."}

    # Generate 6-digit OTP
    otp = f"{random.randint(100000, 999999)}"

    # Store OTP with 10-minute expiry
    with _otp_lock:
        _otp_store[email] = {
            "otp": otp,
            "user_id": str(user.id),
            "expires": datetime.now(timezone.utc) + timedelta(minutes=10),
        }

    logger.info(f"[Password Reset] Generated OTP for {email}")

    # Send OTP email
    _send_otp_email(email, otp)

    return {"message": "If an account with that email exists, a reset code has been sent."}


@router.post("/auth/verify-otp")
async def verify_otp(body: VerifyOtpRequest):
    """Verify the OTP and return a reset token if valid."""
    import logging
    logger = logging.getLogger(__name__)

    email = body.email.lower().strip()

    with _otp_lock:
        stored = _otp_store.get(email)

    if not stored:
        raise HTTPException(status_code=400, detail="No reset code found. Please request a new one.")

    # Check expiry
    if datetime.now(timezone.utc) > stored["expires"]:
        with _otp_lock:
            _otp_store.pop(email, None)
        raise HTTPException(status_code=400, detail="Reset code has expired. Please request a new one.")

    # Check OTP
    if body.otp.strip() != stored["otp"]:
        raise HTTPException(status_code=400, detail="Incorrect code. Please try again.")

    # OTP is valid — remove it and return a reset token
    with _otp_lock:
        _otp_store.pop(email, None)

    # Generate a short-lived reset token (15 minutes)
    reset_token = _create_jwt({
        "sub": stored["user_id"],
        "purpose": "password_reset",
        "exp": (datetime.now(timezone.utc) + timedelta(minutes=15)).isoformat(),
    })

    logger.info(f"[Password Reset] OTP verified for {email}")
    return {"token": reset_token, "message": "Code verified successfully."}


@router.post("/auth/reset-password")
async def reset_password(body: ResetPasswordRequest):
    """Validate the reset token and update the user's password."""
    payload = _decode_jwt(body.token)

    if not payload or payload.get("purpose") != "password_reset":
        raise HTTPException(status_code=400, detail="Invalid or expired reset session.")

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=400, detail="Invalid reset token.")

    if len(body.new_password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters.")

    with Session(_engine) as session:
        user = session.get(User, uuid.UUID(user_id))
        if not user:
            raise HTTPException(status_code=400, detail="User not found.")

        user.hashed_password = _hash_password(body.new_password)
        session.commit()

    return {"message": "Password has been reset successfully. You can now log in."}


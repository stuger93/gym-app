import os

from fastapi import Depends, FastAPI, HTTPException, Request, Response, status
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address
from sqlalchemy.orm import Session

from app.auth import create_access_token, get_current_user, require_rol, verify_password
from app.database import get_db
from app.models import Usuario
from app.schemas import LoginRequest, UsuarioOut

COOKIE_SECURE = os.environ.get("COOKIE_SECURE", "false").lower() == "true"

limiter = Limiter(key_func=get_remote_address)

app = FastAPI()
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.environ["FRONTEND_ORIGIN"]],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/login", response_model=UsuarioOut)
@limiter.limit("5/minute")
def login(
    request: Request,
    response: Response,
    credentials: LoginRequest,
    db: Session = Depends(get_db),
):
    usuario = db.query(Usuario).filter(Usuario.email == credentials.email).first()

    if usuario is None or not verify_password(credentials.password, usuario.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales inválidas",
        )

    token = create_access_token(usuario)
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        secure=COOKIE_SECURE,
        samesite="lax",
    )
    return usuario


@app.get("/me", response_model=UsuarioOut)
def me(usuario: Usuario = Depends(get_current_user)):
    return usuario


@app.post("/logout")
def logout(response: Response):
    response.delete_cookie("access_token")
    return {"status": "ok"}


@app.get("/admin/ping")
def admin_ping(usuario: Usuario = Depends(require_rol("admin"))):
    return {"status": "ok"}

import os
from datetime import date, timedelta

from fastapi import Depends, FastAPI, HTTPException, Request, Response, status
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address
from sqlalchemy import or_
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.auth import create_access_token, get_current_user, require_rol, verify_password
from app.database import get_db
from app.models import Membresia, Plan, Socio, Usuario
from app.schemas import (
    LoginRequest,
    MembresiaCreate,
    MembresiaOut,
    MiMembresiaOut,
    PlanCreate,
    PlanOut,
    PlanUpdate,
    SocioCreate,
    SocioListOut,
    SocioOut,
    SocioUpdate,
    SocioVencidoOut,
    UsuarioOut,
)

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


@app.get("/me/membresia", response_model=MiMembresiaOut)
def mi_membresia(
    usuario: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if usuario.socio_id is None:
        return MiMembresiaOut(tiene_socio_vinculado=False, tiene_membresia_activa=False)

    membresia = (
        db.query(Membresia)
        .filter(Membresia.socio_id == usuario.socio_id, Membresia.activa == True)  # noqa: E712
        .first()
    )
    if membresia is None:
        return MiMembresiaOut(tiene_socio_vinculado=True, tiene_membresia_activa=False)

    return MiMembresiaOut(
        tiene_socio_vinculado=True,
        tiene_membresia_activa=True,
        plan_nombre=membresia.plan.nombre,
        fecha_inicio=membresia.fecha_inicio,
        fecha_vencimiento=membresia.fecha_vencimiento,
        vencida=membresia.vencida,
    )


@app.get("/admin/ping")
def admin_ping(usuario: Usuario = Depends(require_rol("admin"))):
    return {"status": "ok"}


@app.post("/socios", response_model=SocioOut, status_code=status.HTTP_201_CREATED)
def crear_socio(
    datos: SocioCreate,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(require_rol("admin")),
):
    if db.query(Socio).filter(Socio.email == datos.email).first():
        raise HTTPException(status.HTTP_409_CONFLICT, "Ya existe un socio con ese email")
    if db.query(Socio).filter(Socio.documento == datos.documento).first():
        raise HTTPException(status.HTTP_409_CONFLICT, "Ya existe un socio con ese documento")

    socio = Socio(**datos.model_dump())
    db.add(socio)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status.HTTP_409_CONFLICT, "Ya existe un socio con esos datos")

    db.refresh(socio)
    return socio


@app.get("/socios", response_model=SocioListOut)
def listar_socios(
    search: str | None = None,
    page: int = 1,
    page_size: int = 20,
    incluir_inactivos: bool = False,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(require_rol("admin")),
):
    query = db.query(Socio)
    if not incluir_inactivos:
        query = query.filter(Socio.activo == True)  # noqa: E712
    if search:
        patron = f"%{search}%"
        query = query.filter(
            or_(
                Socio.nombre.ilike(patron),
                Socio.email.ilike(patron),
                Socio.documento.ilike(patron),
            )
        )

    total = query.count()
    page = max(page, 1)
    page_size = min(max(page_size, 1), 100)
    items = query.order_by(Socio.id).offset((page - 1) * page_size).limit(page_size).all()

    return {"items": items, "total": total, "page": page, "page_size": page_size}


@app.get("/socios/vencidos", response_model=list[SocioVencidoOut])
def listar_socios_vencidos(
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(require_rol("admin")),
):
    resultados = (
        db.query(Socio, Membresia)
        .join(Membresia, Membresia.socio_id == Socio.id)
        .filter(Socio.activo == True, Membresia.activa == True, Membresia.vencida)  # noqa: E712
        .order_by(Membresia.fecha_vencimiento.asc())
        .all()
    )
    return [
        {
            "id": socio.id,
            "nombre": socio.nombre,
            "email": socio.email,
            "telefono": socio.telefono,
            "documento": socio.documento,
            "plan_nombre": membresia.plan.nombre,
            "fecha_vencimiento": membresia.fecha_vencimiento,
        }
        for socio, membresia in resultados
    ]


@app.get("/socios/{id}", response_model=SocioOut)
def obtener_socio(
    id: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(require_rol("admin")),
):
    socio = db.get(Socio, id)
    if socio is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Socio no encontrado")
    return socio


@app.put("/socios/{id}", response_model=SocioOut)
def actualizar_socio(
    id: int,
    datos: SocioUpdate,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(require_rol("admin")),
):
    socio = db.get(Socio, id)
    if socio is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Socio no encontrado")

    if db.query(Socio).filter(Socio.email == datos.email, Socio.id != id).first():
        raise HTTPException(status.HTTP_409_CONFLICT, "Ya existe un socio con ese email")
    if db.query(Socio).filter(Socio.documento == datos.documento, Socio.id != id).first():
        raise HTTPException(status.HTTP_409_CONFLICT, "Ya existe un socio con ese documento")

    socio.nombre = datos.nombre
    socio.email = datos.email
    socio.documento = datos.documento
    socio.telefono = datos.telefono
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status.HTTP_409_CONFLICT, "Ya existe un socio con esos datos")

    db.refresh(socio)
    return socio


@app.delete("/socios/{id}", status_code=status.HTTP_204_NO_CONTENT)
def dar_de_baja_socio(
    id: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(require_rol("admin")),
):
    socio = db.get(Socio, id)
    if socio is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Socio no encontrado")

    socio.activo = False
    db.commit()


@app.patch("/socios/{id}/reactivar", response_model=SocioOut)
def reactivar_socio(
    id: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(require_rol("admin")),
):
    socio = db.get(Socio, id)
    if socio is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Socio no encontrado")

    socio.activo = True
    db.commit()
    db.refresh(socio)
    return socio


@app.post("/planes", response_model=PlanOut, status_code=status.HTTP_201_CREATED)
def crear_plan(
    datos: PlanCreate,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(require_rol("admin")),
):
    if db.query(Plan).filter(Plan.nombre == datos.nombre).first():
        raise HTTPException(status.HTTP_409_CONFLICT, "Ya existe un plan con ese nombre")

    plan = Plan(**datos.model_dump())
    db.add(plan)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status.HTTP_409_CONFLICT, "Ya existe un plan con ese nombre")

    db.refresh(plan)
    return plan


@app.get("/planes", response_model=list[PlanOut])
def listar_planes(
    incluir_inactivos: bool = False,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(require_rol("admin")),
):
    query = db.query(Plan)
    if not incluir_inactivos:
        query = query.filter(Plan.activo == True)  # noqa: E712
    return query.order_by(Plan.id).all()


@app.get("/planes/{id}", response_model=PlanOut)
def obtener_plan(
    id: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(require_rol("admin")),
):
    plan = db.get(Plan, id)
    if plan is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Plan no encontrado")
    return plan


@app.put("/planes/{id}", response_model=PlanOut)
def actualizar_plan(
    id: int,
    datos: PlanUpdate,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(require_rol("admin")),
):
    plan = db.get(Plan, id)
    if plan is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Plan no encontrado")

    if db.query(Plan).filter(Plan.nombre == datos.nombre, Plan.id != id).first():
        raise HTTPException(status.HTTP_409_CONFLICT, "Ya existe un plan con ese nombre")

    plan.nombre = datos.nombre
    plan.descripcion = datos.descripcion
    plan.precio = datos.precio
    plan.duracion_dias = datos.duracion_dias
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status.HTTP_409_CONFLICT, "Ya existe un plan con ese nombre")

    db.refresh(plan)
    return plan


@app.delete("/planes/{id}", status_code=status.HTTP_204_NO_CONTENT)
def desactivar_plan(
    id: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(require_rol("admin")),
):
    plan = db.get(Plan, id)
    if plan is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Plan no encontrado")

    plan.activo = False
    db.commit()


@app.post(
    "/socios/{id}/membresias",
    response_model=MembresiaOut,
    status_code=status.HTTP_201_CREATED,
)
def asignar_membresia(
    id: int,
    datos: MembresiaCreate,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(require_rol("admin")),
):
    socio = db.get(Socio, id)
    if socio is None or not socio.activo:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Socio no encontrado")

    plan = db.get(Plan, datos.plan_id)
    if plan is None or not plan.activo:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Plan no encontrado o inactivo")

    db.query(Membresia).filter(
        Membresia.socio_id == id, Membresia.activa == True  # noqa: E712
    ).update({"activa": False})

    fecha_inicio = datos.fecha_inicio or date.today()
    fecha_vencimiento = fecha_inicio + timedelta(days=plan.duracion_dias)

    membresia = Membresia(
        socio_id=id,
        plan_id=plan.id,
        fecha_inicio=fecha_inicio,
        fecha_vencimiento=fecha_vencimiento,
        activa=True,
    )
    db.add(membresia)
    db.commit()
    db.refresh(membresia)
    return membresia


@app.get("/socios/{id}/membresias", response_model=list[MembresiaOut])
def listar_membresias(
    id: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(require_rol("admin")),
):
    socio = db.get(Socio, id)
    if socio is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Socio no encontrado")

    return (
        db.query(Membresia)
        .filter(Membresia.socio_id == id)
        .order_by(Membresia.fecha_inicio.desc())
        .all()
    )

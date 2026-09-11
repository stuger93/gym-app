from datetime import date
from decimal import Decimal

from pydantic import BaseModel, EmailStr


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UsuarioOut(BaseModel):
    id: int
    email: EmailStr
    rol: str

    class Config:
        from_attributes = True


class SocioCreate(BaseModel):
    nombre: str
    email: EmailStr
    documento: str
    telefono: str | None = None


class SocioUpdate(BaseModel):
    nombre: str
    email: EmailStr
    documento: str
    telefono: str | None = None


class SocioOut(BaseModel):
    id: int
    nombre: str
    email: EmailStr
    documento: str
    telefono: str | None
    activo: bool

    class Config:
        from_attributes = True


class SocioListOut(BaseModel):
    items: list[SocioOut]
    total: int
    page: int
    page_size: int


class PlanCreate(BaseModel):
    nombre: str
    descripcion: str | None = None
    precio: Decimal
    duracion_dias: int


class PlanUpdate(BaseModel):
    nombre: str
    descripcion: str | None = None
    precio: Decimal
    duracion_dias: int


class PlanOut(BaseModel):
    id: int
    nombre: str
    descripcion: str | None
    precio: Decimal
    duracion_dias: int
    activo: bool

    class Config:
        from_attributes = True


class MembresiaCreate(BaseModel):
    plan_id: int
    fecha_inicio: date | None = None


class MembresiaOut(BaseModel):
    id: int
    socio_id: int
    plan_id: int
    fecha_inicio: date
    fecha_vencimiento: date
    activa: bool
    vencida: bool
    plan: PlanOut

    class Config:
        from_attributes = True


class SocioVencidoOut(BaseModel):
    id: int
    nombre: str
    email: EmailStr
    telefono: str | None
    documento: str
    plan_nombre: str
    fecha_vencimiento: date


class MiMembresiaOut(BaseModel):
    tiene_socio_vinculado: bool
    tiene_membresia_activa: bool
    plan_nombre: str | None = None
    fecha_inicio: date | None = None
    fecha_vencimiento: date | None = None
    vencida: bool | None = None

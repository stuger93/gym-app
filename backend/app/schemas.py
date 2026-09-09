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


class SocioOut(BaseModel):
    id: int
    nombre: str
    email: EmailStr
    documento: str
    telefono: str | None

    class Config:
        from_attributes = True

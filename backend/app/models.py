from sqlalchemy import Boolean, Column, Integer, Numeric, String, true

from app.database import Base


class Socio(Base):
    __tablename__ = "socios"

    id = Column(Integer, primary_key=True)
    nombre = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    documento = Column(String, unique=True, nullable=False)
    telefono = Column(String, nullable=True)
    activo = Column(Boolean, nullable=False, default=True, server_default=true())


class Plan(Base):
    __tablename__ = "planes"

    id = Column(Integer, primary_key=True)
    nombre = Column(String, unique=True, nullable=False)
    descripcion = Column(String, nullable=True)
    precio = Column(Numeric(10, 2), nullable=False)
    duracion_dias = Column(Integer, nullable=False)
    activo = Column(Boolean, nullable=False, default=True, server_default=true())


class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True)
    email = Column(String, unique=True, nullable=False)
    password_hash = Column(String, nullable=False)
    rol = Column(String, nullable=False, default="admin")

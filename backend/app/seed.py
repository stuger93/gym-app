import os

from app.auth import hash_password
from app.database import SessionLocal
from app.models import Usuario


def seed_admin():
    admin_email = os.environ["ADMIN_EMAIL"]
    admin_password = os.environ["ADMIN_PASSWORD"]

    db = SessionLocal()
    try:
        existing = db.query(Usuario).filter(Usuario.email == admin_email).first()
        if existing is not None:
            print(f"Usuario admin '{admin_email}' ya existe, no se crea de nuevo.")
            return

        usuario = Usuario(
            email=admin_email,
            password_hash=hash_password(admin_password),
            rol="admin",
        )
        db.add(usuario)
        db.commit()
        print(f"Usuario admin '{admin_email}' creado.")
    finally:
        db.close()


if __name__ == "__main__":
    seed_admin()

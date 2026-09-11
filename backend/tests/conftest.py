import os

import psycopg2
from psycopg2 import errors as psycopg2_errors
from sqlalchemy import create_engine
from sqlalchemy.engine import make_url
from sqlalchemy.orm import sessionmaker

# IMPORTANTE: la URL de test se fija ANTES de importar cualquier módulo de app.*,
# porque app/database.py lee DATABASE_URL del entorno al momento de importarse.
# Esto evita que los tests toquen la base de datos de desarrollo real.
_dev_url = make_url(os.environ["DATABASE_URL"])
_test_db_name = f"{_dev_url.database}_test"
_test_url = _dev_url.set(database=_test_db_name)
os.environ["DATABASE_URL"] = _test_url.render_as_string(hide_password=False)

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from app.auth import hash_password  # noqa: E402
from app.database import Base, get_db  # noqa: E402
from app.main import app  # noqa: E402
from app.models import Usuario  # noqa: E402,F401


def _crear_base_de_test():
    conexion = psycopg2.connect(
        dbname=_dev_url.database,
        user=_dev_url.username,
        password=_dev_url.password,
        host=_dev_url.host,
        port=_dev_url.port,
    )
    conexion.autocommit = True
    try:
        with conexion.cursor() as cur:
            cur.execute(f'CREATE DATABASE "{_test_db_name}"')
    except psycopg2_errors.DuplicateDatabase:
        pass
    finally:
        conexion.close()


_crear_base_de_test()

engine = create_engine(_test_url.render_as_string(hide_password=False))
Base.metadata.drop_all(engine)
Base.metadata.create_all(engine)

TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture()
def db_session():
    """Cada test corre en una transacción con SAVEPOINT que se revierte al final,
    así ningún test deja datos residuales ni afecta a los demás."""
    connection = engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection, join_transaction_mode="create_savepoint")

    yield session

    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture()
def client(db_session):
    def _get_db_override():
        yield db_session

    app.dependency_overrides[get_db] = _get_db_override
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture(autouse=True)
def _resetear_rate_limiter():
    """Evita que el rate limit de /login (en memoria) se contamine entre tests."""
    yield
    app.state.limiter.reset()


@pytest.fixture()
def crear_usuario(db_session):
    def _crear(email="admin@test.com", password="Password123!", rol="admin", socio_id=None):
        usuario = Usuario(
            email=email,
            password_hash=hash_password(password),
            rol=rol,
            socio_id=socio_id,
        )
        db_session.add(usuario)
        db_session.commit()
        db_session.refresh(usuario)
        return usuario, password

    return _crear


@pytest.fixture()
def login(client):
    def _login(email, password):
        res = client.post("/login", json={"email": email, "password": password})
        assert res.status_code == 200, res.text
        return res

    return _login

from datetime import date, timedelta

from app.models import Membresia, Plan, Socio


def _login_admin(client, crear_usuario, login):
    usuario, password = crear_usuario(email="admin@test.com", password="Password123!", rol="admin")
    login(usuario.email, password)


def test_fecha_vencimiento_se_calcula_desde_duracion_del_plan(client, crear_usuario, login):
    _login_admin(client, crear_usuario, login)
    socio = client.post(
        "/socios", json={"nombre": "Juan", "email": "juan@test.com", "documento": "1"}
    ).json()
    plan = client.post(
        "/planes", json={"nombre": "Mensual", "precio": 5000, "duracion_dias": 30}
    ).json()

    fecha_inicio = date.today()
    res = client.post(
        f"/socios/{socio['id']}/membresias",
        json={"plan_id": plan["id"], "fecha_inicio": fecha_inicio.isoformat()},
    )

    assert res.status_code == 201
    esperado = (fecha_inicio + timedelta(days=30)).isoformat()
    assert res.json()["fecha_vencimiento"] == esperado


def test_asignar_plan_nuevo_desactiva_membresia_anterior(client, crear_usuario, login):
    _login_admin(client, crear_usuario, login)
    socio = client.post(
        "/socios", json={"nombre": "Juan", "email": "juan@test.com", "documento": "1"}
    ).json()
    plan_a = client.post(
        "/planes", json={"nombre": "Mensual", "precio": 5000, "duracion_dias": 30}
    ).json()
    plan_b = client.post(
        "/planes", json={"nombre": "Anual", "precio": 45000, "duracion_dias": 365}
    ).json()

    primera = client.post(
        f"/socios/{socio['id']}/membresias", json={"plan_id": plan_a["id"]}
    ).json()
    client.post(f"/socios/{socio['id']}/membresias", json={"plan_id": plan_b["id"]})

    historial = client.get(f"/socios/{socio['id']}/membresias").json()
    primera_actualizada = next(m for m in historial if m["id"] == primera["id"])

    assert primera_actualizada["activa"] is False


def test_membresia_vencida_con_fecha_pasada(db_session):
    socio = Socio(nombre="Juan", email="juan@test.com", documento="1")
    plan = Plan(nombre="Mensual", precio=5000, duracion_dias=30)
    db_session.add_all([socio, plan])
    db_session.flush()

    membresia = Membresia(
        socio_id=socio.id,
        plan_id=plan.id,
        fecha_inicio=date.today() - timedelta(days=60),
        fecha_vencimiento=date.today() - timedelta(days=30),
    )
    db_session.add(membresia)
    db_session.commit()

    assert membresia.vencida is True


def test_membresia_no_vencida_con_fecha_futura(db_session):
    socio = Socio(nombre="Juan", email="juan@test.com", documento="1")
    plan = Plan(nombre="Mensual", precio=5000, duracion_dias=30)
    db_session.add_all([socio, plan])
    db_session.flush()

    membresia = Membresia(
        socio_id=socio.id,
        plan_id=plan.id,
        fecha_inicio=date.today(),
        fecha_vencimiento=date.today() + timedelta(days=30),
    )
    db_session.add(membresia)
    db_session.commit()

    assert membresia.vencida is False

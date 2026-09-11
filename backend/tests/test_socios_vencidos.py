from datetime import date, timedelta

from app.models import Membresia, Plan, Socio


def _login_admin(client, crear_usuario, login):
    usuario, password = crear_usuario(email="admin@test.com", password="Password123!", rol="admin")
    login(usuario.email, password)


def _crear_plan(db_session, nombre="Mensual"):
    plan = Plan(nombre=nombre, precio=5000, duracion_dias=30)
    db_session.add(plan)
    db_session.flush()
    return plan


def test_lista_solo_socios_con_membresia_activa_y_vencida(
    client, db_session, crear_usuario, login
):
    _login_admin(client, crear_usuario, login)

    plan = _crear_plan(db_session)

    # Caso 1: activa=True y vencida -> debe aparecer
    socio_vencido = Socio(nombre="Vencido", email="vencido@test.com", documento="1")
    db_session.add(socio_vencido)
    db_session.flush()
    db_session.add(
        Membresia(
            socio_id=socio_vencido.id,
            plan_id=plan.id,
            fecha_inicio=date.today() - timedelta(days=60),
            fecha_vencimiento=date.today() - timedelta(days=30),
            activa=True,
        )
    )

    # Caso 2: activa=True pero vigente -> NO debe aparecer
    socio_vigente = Socio(nombre="Vigente", email="vigente@test.com", documento="2")
    db_session.add(socio_vigente)
    db_session.flush()
    db_session.add(
        Membresia(
            socio_id=socio_vigente.id,
            plan_id=plan.id,
            fecha_inicio=date.today(),
            fecha_vencimiento=date.today() + timedelta(days=30),
            activa=True,
        )
    )

    # Caso 3: vencida pero activa=False (historial reemplazado) -> NO debe aparecer
    socio_historial = Socio(nombre="Historial", email="historial@test.com", documento="3")
    db_session.add(socio_historial)
    db_session.flush()
    db_session.add(
        Membresia(
            socio_id=socio_historial.id,
            plan_id=plan.id,
            fecha_inicio=date.today() - timedelta(days=90),
            fecha_vencimiento=date.today() - timedelta(days=60),
            activa=False,
        )
    )

    db_session.commit()

    res = client.get("/socios/vencidos")

    assert res.status_code == 200
    nombres = [s["nombre"] for s in res.json()]
    assert nombres == ["Vencido"]


def test_lista_vacia_sin_sesion(client):
    res = client.get("/socios/vencidos")

    assert res.status_code == 401

def _login_admin(client, crear_usuario, login):
    usuario, password = crear_usuario(email="admin@test.com", password="Password123!", rol="admin")
    login(usuario.email, password)


def _crear_socio(client, nombre="Juan", email="juan@test.com", documento="1"):
    return client.post(
        "/socios", json={"nombre": nombre, "email": email, "documento": documento}
    ).json()


def _crear_plan(client, nombre="Mensual"):
    return client.post(
        "/planes", json={"nombre": nombre, "precio": 5000, "duracion_dias": 30}
    ).json()


def test_registrar_pago_sin_membresia(client, crear_usuario, login):
    _login_admin(client, crear_usuario, login)
    socio = _crear_socio(client)

    res = client.post(
        f"/socios/{socio['id']}/pagos",
        json={"monto": 5000, "metodo": "efectivo"},
    )

    assert res.status_code == 201
    body = res.json()
    assert body["socio_id"] == socio["id"]
    assert body["membresia_id"] is None
    assert body["metodo"] == "efectivo"
    assert body["fecha"] is not None


def test_registrar_pago_con_membresia_valida(client, crear_usuario, login):
    _login_admin(client, crear_usuario, login)
    socio = _crear_socio(client)
    plan = _crear_plan(client)
    membresia = client.post(
        f"/socios/{socio['id']}/membresias", json={"plan_id": plan["id"]}
    ).json()

    res = client.post(
        f"/socios/{socio['id']}/pagos",
        json={"monto": 5000, "metodo": "transferencia", "membresia_id": membresia["id"]},
    )

    assert res.status_code == 201
    assert res.json()["membresia_id"] == membresia["id"]


def test_registrar_pago_con_membresia_de_otro_socio_falla(client, crear_usuario, login):
    _login_admin(client, crear_usuario, login)
    socio_a = _crear_socio(client, nombre="A", email="a@test.com", documento="1")
    socio_b = _crear_socio(client, nombre="B", email="b@test.com", documento="2")
    plan = _crear_plan(client)
    membresia_de_a = client.post(
        f"/socios/{socio_a['id']}/membresias", json={"plan_id": plan["id"]}
    ).json()

    res = client.post(
        f"/socios/{socio_b['id']}/pagos",
        json={"monto": 5000, "metodo": "efectivo", "membresia_id": membresia_de_a["id"]},
    )

    assert res.status_code == 404


def test_registrar_pago_a_socio_inexistente(client, crear_usuario, login):
    _login_admin(client, crear_usuario, login)

    res = client.post(
        "/socios/9999/pagos",
        json={"monto": 5000, "metodo": "efectivo"},
    )

    assert res.status_code == 404


def test_pago_con_renovar_con_plan_id_crea_membresia_y_desactiva_anterior(
    client, crear_usuario, login
):
    _login_admin(client, crear_usuario, login)
    socio = _crear_socio(client)
    plan_viejo = _crear_plan(client, nombre="Mensual")
    plan_nuevo = _crear_plan(client, nombre="Anual")
    membresia_vieja = client.post(
        f"/socios/{socio['id']}/membresias", json={"plan_id": plan_viejo["id"]}
    ).json()

    res = client.post(
        f"/socios/{socio['id']}/pagos",
        json={"monto": 45000, "metodo": "efectivo", "renovar_con_plan_id": plan_nuevo["id"]},
    )

    assert res.status_code == 201
    pago = res.json()
    assert pago["membresia_id"] is not None
    assert pago["membresia_id"] != membresia_vieja["id"]

    historial = client.get(f"/socios/{socio['id']}/membresias").json()
    vieja_actualizada = next(m for m in historial if m["id"] == membresia_vieja["id"])
    nueva = next(m for m in historial if m["id"] == pago["membresia_id"])
    assert vieja_actualizada["activa"] is False
    assert nueva["activa"] is True
    assert nueva["plan_id"] == plan_nuevo["id"]


def test_pago_con_renovar_con_plan_id_sin_membresia_previa(client, crear_usuario, login):
    _login_admin(client, crear_usuario, login)
    socio = _crear_socio(client)
    plan = _crear_plan(client)

    res = client.post(
        f"/socios/{socio['id']}/pagos",
        json={"monto": 5000, "metodo": "efectivo", "renovar_con_plan_id": plan["id"]},
    )

    assert res.status_code == 201
    pago = res.json()
    assert pago["membresia_id"] is not None

    historial = client.get(f"/socios/{socio['id']}/membresias").json()
    assert len(historial) == 1
    assert historial[0]["id"] == pago["membresia_id"]
    assert historial[0]["activa"] is True


def test_pago_renovar_con_plan_inexistente_falla(client, crear_usuario, login):
    _login_admin(client, crear_usuario, login)
    socio = _crear_socio(client)

    res = client.post(
        f"/socios/{socio['id']}/pagos",
        json={"monto": 5000, "metodo": "efectivo", "renovar_con_plan_id": 9999},
    )

    assert res.status_code == 404


def test_pago_renovar_con_plan_inactivo_falla(client, crear_usuario, login):
    _login_admin(client, crear_usuario, login)
    socio = _crear_socio(client)
    plan = _crear_plan(client)
    client.delete(f"/planes/{plan['id']}")

    res = client.post(
        f"/socios/{socio['id']}/pagos",
        json={"monto": 5000, "metodo": "efectivo", "renovar_con_plan_id": plan["id"]},
    )

    assert res.status_code == 404


def test_pago_con_membresia_id_y_renovar_con_plan_id_juntos_falla(
    client, crear_usuario, login
):
    _login_admin(client, crear_usuario, login)
    socio = _crear_socio(client)
    plan = _crear_plan(client)
    membresia = client.post(
        f"/socios/{socio['id']}/membresias", json={"plan_id": plan["id"]}
    ).json()

    res = client.post(
        f"/socios/{socio['id']}/pagos",
        json={
            "monto": 5000,
            "metodo": "efectivo",
            "membresia_id": membresia["id"],
            "renovar_con_plan_id": plan["id"],
        },
    )

    assert res.status_code == 400


def test_registrar_pago_rechazado_sin_rol_admin(client, crear_usuario, login):
    admin, admin_password = crear_usuario(
        email="admin2@test.com", password="Password123!", rol="admin"
    )
    login(admin.email, admin_password)
    socio = _crear_socio(client)

    otro, otro_password = crear_usuario(
        email="socio@test.com", password="Password123!", rol="socio"
    )
    login(otro.email, otro_password)

    res = client.post(
        f"/socios/{socio['id']}/pagos",
        json={"monto": 5000, "metodo": "efectivo"},
    )

    assert res.status_code == 403

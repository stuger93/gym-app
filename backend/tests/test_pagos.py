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

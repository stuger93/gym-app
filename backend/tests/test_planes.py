def _login_admin(client, crear_usuario, login):
    usuario, password = crear_usuario(email="admin@test.com", password="Password123!", rol="admin")
    login(usuario.email, password)


def test_crear_plan_exitoso(client, crear_usuario, login):
    _login_admin(client, crear_usuario, login)

    res = client.post("/planes", json={"nombre": "Mensual", "precio": 5000, "duracion_dias": 30})

    assert res.status_code == 201
    assert res.json()["activo"] is True


def test_crear_plan_nombre_duplicado(client, crear_usuario, login):
    _login_admin(client, crear_usuario, login)
    client.post("/planes", json={"nombre": "Mensual", "precio": 5000, "duracion_dias": 30})

    res = client.post("/planes", json={"nombre": "Mensual", "precio": 6000, "duracion_dias": 31})

    assert res.status_code == 409
    assert res.json()["detail"] == "Ya existe un plan con ese nombre"


def test_actualizar_plan_no_se_rechaza_a_si_mismo(client, crear_usuario, login):
    _login_admin(client, crear_usuario, login)
    creado = client.post(
        "/planes", json={"nombre": "Mensual", "precio": 5000, "duracion_dias": 30}
    ).json()

    res = client.put(
        f"/planes/{creado['id']}",
        json={"nombre": "Mensual", "precio": 5000, "duracion_dias": 30},
    )

    assert res.status_code == 200


def test_actualizar_plan_nombre_de_otro_plan(client, crear_usuario, login):
    _login_admin(client, crear_usuario, login)
    client.post("/planes", json={"nombre": "Mensual", "precio": 5000, "duracion_dias": 30})
    trimestral = client.post(
        "/planes", json={"nombre": "Trimestral", "precio": 13000, "duracion_dias": 90}
    ).json()

    res = client.put(
        f"/planes/{trimestral['id']}",
        json={"nombre": "Mensual", "precio": 13000, "duracion_dias": 90},
    )

    assert res.status_code == 409

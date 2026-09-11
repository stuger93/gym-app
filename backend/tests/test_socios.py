def _login_admin(client, crear_usuario, login):
    usuario, password = crear_usuario(email="admin@test.com", password="Password123!", rol="admin")
    login(usuario.email, password)


def test_crear_socio_exitoso(client, crear_usuario, login):
    _login_admin(client, crear_usuario, login)

    res = client.post(
        "/socios",
        json={"nombre": "Juan Test", "email": "juan@test.com", "documento": "111111"},
    )

    assert res.status_code == 201
    assert res.json()["activo"] is True


def test_crear_socio_email_duplicado(client, crear_usuario, login):
    _login_admin(client, crear_usuario, login)
    client.post(
        "/socios",
        json={"nombre": "Uno", "email": "dup@test.com", "documento": "111"},
    )

    res = client.post(
        "/socios",
        json={"nombre": "Dos", "email": "dup@test.com", "documento": "222"},
    )

    assert res.status_code == 409
    assert res.json()["detail"] == "Ya existe un socio con ese email"


def test_crear_socio_documento_duplicado(client, crear_usuario, login):
    _login_admin(client, crear_usuario, login)
    client.post(
        "/socios",
        json={"nombre": "Uno", "email": "uno@test.com", "documento": "999"},
    )

    res = client.post(
        "/socios",
        json={"nombre": "Dos", "email": "dos@test.com", "documento": "999"},
    )

    assert res.status_code == 409
    assert res.json()["detail"] == "Ya existe un socio con ese documento"


def test_actualizar_socio_no_se_rechaza_a_si_mismo(client, crear_usuario, login):
    _login_admin(client, crear_usuario, login)
    creado = client.post(
        "/socios",
        json={"nombre": "Uno", "email": "uno@test.com", "documento": "555"},
    ).json()

    res = client.put(
        f"/socios/{creado['id']}",
        json={"nombre": "Uno", "email": "uno@test.com", "documento": "555"},
    )

    assert res.status_code == 200


def test_actualizar_socio_email_de_otro_socio(client, crear_usuario, login):
    _login_admin(client, crear_usuario, login)
    client.post("/socios", json={"nombre": "Uno", "email": "uno@test.com", "documento": "1"})
    dos = client.post(
        "/socios", json={"nombre": "Dos", "email": "dos@test.com", "documento": "2"}
    ).json()

    res = client.put(
        f"/socios/{dos['id']}",
        json={"nombre": "Dos", "email": "uno@test.com", "documento": "2"},
    )

    assert res.status_code == 409

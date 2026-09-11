def test_login_credenciales_correctas(client, crear_usuario):
    usuario, password = crear_usuario(email="ok@test.com", password="Password123!")

    res = client.post("/login", json={"email": usuario.email, "password": password})

    assert res.status_code == 200
    assert res.json()["email"] == usuario.email
    assert "access_token" in res.cookies


def test_login_password_incorrecta(client, crear_usuario):
    usuario, _ = crear_usuario(email="wrongpass@test.com", password="Password123!")

    res = client.post("/login", json={"email": usuario.email, "password": "otra-cosa"})

    assert res.status_code == 401
    assert res.json()["detail"] == "Credenciales inválidas"


def test_login_email_inexistente(client):
    res = client.post("/login", json={"email": "no-existe@test.com", "password": "loquesea"})

    assert res.status_code == 401
    assert res.json()["detail"] == "Credenciales inválidas"


def test_login_rate_limit_bloquea_al_sexto_intento(client, crear_usuario):
    usuario, _ = crear_usuario(email="ratelimit@test.com", password="Password123!")

    for _ in range(5):
        res = client.post("/login", json={"email": usuario.email, "password": "incorrecta"})
        assert res.status_code == 401

    res = client.post("/login", json={"email": usuario.email, "password": "incorrecta"})

    assert res.status_code == 429

def test_admin_ping_permitido_para_rol_admin(client, crear_usuario, login):
    usuario, password = crear_usuario(email="admin@test.com", password="Password123!", rol="admin")
    login(usuario.email, password)

    res = client.get("/admin/ping")

    assert res.status_code == 200


def test_admin_ping_rechazado_para_otro_rol(client, crear_usuario, login):
    usuario, password = crear_usuario(email="socio@test.com", password="Password123!", rol="socio")
    login(usuario.email, password)

    res = client.get("/admin/ping")

    assert res.status_code == 403
    assert res.json()["detail"] == "No autorizado"


def test_admin_ping_rechazado_sin_sesion(client):
    res = client.get("/admin/ping")

    assert res.status_code == 401
    assert res.json()["detail"] == "No autenticado"

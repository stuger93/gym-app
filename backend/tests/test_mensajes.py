from datetime import date

from app.mensajes import generar_mensaje_recordatorio

HOY = date(2026, 9, 18)


def test_mensaje_vencida_incluye_nombre_plan_y_fecha_formateada():
    mensaje = generar_mensaje_recordatorio("Juan", "Mensual", date(2026, 3, 5), hoy=HOY)

    assert "Juan" in mensaje
    assert "Mensual" in mensaje
    assert "05/03/2026" in mensaje
    assert "2026-03-05" not in mensaje
    assert "venció" in mensaje
    assert "renovarla" in mensaje


def test_mensaje_por_vencer_usa_futuro():
    mensaje = generar_mensaje_recordatorio("Juan", "Mensual", date(2026, 9, 30), hoy=HOY)

    assert "vence el 30/09/2026" in mensaje
    assert "venció" not in mensaje


def test_mensaje_que_vence_hoy_no_dice_que_ya_vencio():
    mensaje = generar_mensaje_recordatorio("Juan", "Mensual", HOY, hoy=HOY)

    assert "vence el 18/09/2026" in mensaje


def test_mensaje_con_tildes_y_enie():
    mensaje = generar_mensaje_recordatorio(
        "María José", "Plan Año Nuevo", date(2026, 1, 9), hoy=HOY
    )

    assert "Hola María José," in mensaje
    assert "Plan Año Nuevo" in mensaje
    assert "09/01/2026" in mensaje


def test_mensaje_con_espacios_raros_los_normaliza():
    mensaje = generar_mensaje_recordatorio(
        "  María   José ", " Trimestral ", date(2026, 3, 5), hoy=HOY
    )

    assert "Hola María José, tu membresía del plan Trimestral venció" in mensaje


def test_mensaje_sin_hoy_explicito_no_rompe():
    mensaje = generar_mensaje_recordatorio("Ana", "Anual", date(2000, 1, 1))

    assert "01/01/2000" in mensaje

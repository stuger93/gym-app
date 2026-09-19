from datetime import date


def generar_mensaje_recordatorio(
    nombre: str,
    plan_nombre: str,
    fecha_vencimiento: date,
    hoy: date | None = None,
) -> str:
    """Texto cordial de recordatorio de vencimiento de membresía.

    Función pura: `hoy` es inyectable para que el resultado sea determinista;
    si no se pasa, se usa la fecha actual.
    """
    hoy = hoy or date.today()
    fecha = fecha_vencimiento.strftime("%d/%m/%Y")
    nombre = " ".join(nombre.split())
    plan_nombre = " ".join(plan_nombre.split())

    if fecha_vencimiento < hoy:
        return (
            f"Hola {nombre}, tu membresía del plan {plan_nombre} venció el {fecha}. "
            "¡Te esperamos para renovarla!"
        )
    return (
        f"Hola {nombre}, tu membresía del plan {plan_nombre} vence el {fecha}. "
        "¡Te esperamos para renovarla!"
    )

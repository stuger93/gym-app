# ADR-003: Tablas separadas "usuarios" y "socios"

**Estado:** Aceptada
**Fecha:** 2026-09-06
**Contexto de la decisión:** Sprint 1, Rebanada 1 (Login y autenticación)

## Contexto

Desde el Sprint 0 el proyecto ya tenía una tabla `socios` (`id`, `nombre`, `email`), pensada como la entidad de dominio central del gimnasio: la persona que se inscribe y entrena. Al implementar login, surgió la pregunta de si el usuario que se autentica en el sistema (hoy, un admin) debía representarse reutilizando esa misma tabla — agregándole `password_hash` y un campo `rol` — o si convenía crear una tabla `usuarios` nueva y separada.

Estos son dos conceptos que, aunque hoy pueden coincidir en una sola persona, no son lo mismo: un **socio** es alguien que entrena en el gimnasio; un **usuario** es alguien que tiene credenciales para entrar al sistema (hoy el admin, mañana probablemente instructores o personal de recepción). No todo socio necesita acceso al sistema, y no todo usuario del sistema es necesariamente un socio.

## Decisión

Se crea una tabla `usuarios` independiente (`id`, `email`, `password_hash`, `rol`), separada de `socios` (`id`, `nombre`, `email`), sin relación entre ambas por el momento.

## Alternativas consideradas

**Tabla única `socios` con campos de autenticación agregados** (`password_hash` nullable, `rol`). Se descartó porque:
- Obliga a que `password_hash` sea nullable en `socios` (no todo socio tiene login), lo que degrada la calidad del modelo de datos y complica las validaciones ("¿este socio puede loguearse o no? depende de si ese campo es null").
- Mezcla dos ciclos de vida distintos: un socio puede existir sin haber tenido nunca una cuenta de acceso, y un usuario del sistema (staff, admin) puede no ser socio nunca. Modelarlos como la misma entidad fuerza a que evolucionen juntos cuando en la práctica son independientes.
- A medida que el sistema crezca (roles de instructor, recepción, etc.), la tabla `socios` se iría llenando de columnas que no tienen que ver con el dominio "persona que entrena", sino con el dominio "acceso al sistema".

## Consecuencias

- **Modelos más claros**: cada tabla representa un único concepto de negocio, sin campos condicionales según el rol.
- **Sin acoplamiento innecesario**: cambios en el modelo de autenticación (nuevos roles, políticas de contraseña, MFA a futuro) no tocan la tabla `socios`, y viceversa (agregar campos de perfil del socio no afecta el modelo de usuarios).
- **Vínculo pendiente para el futuro**: si más adelante se necesita que un socio tenga su propio login (por ejemplo, un portal de autogestión), se puede agregar una FK opcional `socio_id` en `usuarios` sin romper nada de lo ya implementado. No se implementa ahora porque no hay una historia que lo requiera todavía (evita construir para un caso de uso hipotético).
- **Duplicación menor de `email`**: hoy tanto `socios` como `usuarios` tienen su propio campo `email`, potencialmente repitiendo el valor si la misma persona es ambas cosas. Es un costo aceptado a cambio de mantener los dominios desacoplados; si se implementa el vínculo `socio_id` a futuro, se podría evaluar si conviene deduplicar ese dato.

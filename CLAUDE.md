# CLAUDE.md — Gym App

## Stack
- Backend: Python + FastAPI + SQLAlchemy + Alembic
- Base de datos: PostgreSQL
- Frontend: React (Vite) + React Query + React Hook Form
- Infra: Docker Compose para desarrollo local

## Estructura
- backend/ → API FastAPI
- frontend/ → app React
- docker-compose.yml → levanta api + db + front

## Comandos
- Levantar todo: docker-compose up
- Migraciones: alembic upgrade head
- Tests backend: docker compose exec backend pytest (usa una base de datos de test separada, aislada por transacción con rollback por test — nunca toca la base de desarrollo)
- Tests frontend: docker compose exec frontend npm run test (Vitest)

## Convenciones
- Commits descriptivos, uno por fase completada
- Cambios grandes o riesgosos: usar Plan mode primero
- Pedir cambios de a uno a la vez

## Seguridad (obligatorio en todo el proyecto)
- Nunca hardcodear credenciales, tokens o secretos en el código: usar variables de entorno (.env, nunca subido a git)
- Contraseñas de usuarios siempre hasheadas (bcrypt/passlib), nunca en texto plano
- Validar y sanear todo input con Pydantic antes de tocar la base de datos
- Usar siempre queries parametrizadas del ORM (SQLAlchemy) — nunca concatenar SQL a mano, para evitar SQL injection
- Todo endpoint que modifique o lea datos sensibles debe estar protegido con autenticación y verificación de rol (no confiar solo en el frontend)
- Configurar CORS de forma restrictiva (solo el dominio del frontend, no "*")
- No exponer mensajes de error internos ni stack traces al cliente en producción
- Antes de cada despliegue, ejecutar una revisión de seguridad del código (usar la skill engineering:code-review) y aplicar la skill engineering:deploy-checklist
- Mantener dependencias actualizadas (revisar vulnerabilidades conocidas antes de cada release)

## Estado del proyecto
- Sprint 0 (setup fundacional): completado
- Historias completadas: 0.1 (Docker Compose con Postgres, backend y frontend) — incluye de facto 0.4 (endpoint /health), 0.3 (Alembic configurado con migración inicial), 0.5 (CI con GitHub Actions)
- Sprint 1: completado (las 5 rebanadas)
  - Rebanada 1 (Login y autenticación): completada — usuarios, JWT, cookie httpOnly, rate limiting; ver docs/adr/ y SECURITY.md
  - Rebanada 2 (Roles y protección de endpoints): completada — dependency require_rol reusable sobre get_current_user, endpoint de prueba GET /admin/ping
  - Rebanada 3 (Registrar un socio): completada — Socio gana documento (único) y telefono; POST /socios protegido con require_rol("admin"), valida duplicados de email/documento (409); formulario "Nuevo socio" en el frontend
  - Rebanada 4 (Listar y buscar socios): completada — GET /socios con búsqueda (ILIKE sobre nombre/email/documento) y paginación, protegido con require_rol("admin"); pantalla de lista con buscador debounced y estados vacíos claros
  - Rebanada 5 (Editar y dar de baja un socio): completada — Socio gana activo (baja lógica); GET/PUT/DELETE /socios/{id} protegidos con require_rol("admin"), PUT valida unicidad excluyendo al propio socio; edición y baja (con confirmación) en el frontend, toggle "Mostrar inactivos" en el listado
- Sprint 2: completado (las 4 rebanadas)
  - Rebanada 1 (Definir planes de membresía): completada — modelo Plan (nombre único, descripción, precio Numeric, duracion_dias, activo); POST/GET/PUT/DELETE /planes protegidos con require_rol("admin"), DELETE es baja lógica igual que Socio; pantalla de administración de planes en el frontend (crear/editar/desactivar), sin relación con Socio todavía (llega en la Rebanada 2)
  - Rebanada 2 (Asignar un plan a un socio): completada — tabla Membresia (socio_id, plan_id, fecha_inicio, fecha_vencimiento, activa) con historial completo; POST/GET /socios/{id}/membresias protegidos con require_rol("admin"); fecha_vencimiento calculada en el backend (fecha_inicio + duracion_dias del plan); al asignar un plan nuevo, la membresía activa previa se desactiva automáticamente; sección "Membresía" (vigente + historial + asignar) en la ficha del socio
  - Rebanada 3 (Detectar membresías vencidas): completada — Membresia.vencida como hybrid_property (calculado al vuelo, sin campo persistido ni job de sincronización), usable tanto en Python como en filtros SQL; GET /socios/vencidos lista socios cuya membresía vigente (activa=true) ya venció, protegido con require_rol("admin"); pantalla "Vencimientos" en el frontend con link de renovación a la ficha del socio
  - Rebanada 4 (Vista de membresía para el socio): completada — Usuario gana socio_id (FK opcional, nullable, no rompe al admin); GET /me/membresia protegido solo con get_current_user (cualquier rol), responde siempre 200 coherente (con/sin socio vinculado, con/sin membresía activa); HomePage ramifica por rol (admin ve gestión, socio ve su propio estado de membresía); usuario de prueba rol "socio" creado manualmente (no commiteado), igual patrón que "staff" en Sprint 1
- Sprint 3: completado (las 4 rebanadas)
  - Rebanada 1 (Registrar un pago de un socio): completada — modelo Pago (socio_id obligatorio, membresia_id opcional, monto Numeric, fecha, metodo); POST /socios/{id}/pagos protegido con require_rol("admin"), valida que el socio exista/esté activo y que la membresía (si se manda) exista y pertenezca a ese socio (404 si no); fecha default hoy si no se manda; todavía NO renueva ni toca la membresía asociada (queda para la Rebanada 2)
  - Rebanada 2 (Conectar un pago con la renovación de membresía): completada — lógica de "desactivar membresía activa + crear una nueva" extraída de asignar_membresia a la función compartida _crear_membresia (usa flush() en vez de commit() para poder confirmarse junto con el pago en una sola transacción atómica); PagoCreate gana renovar_con_plan_id opcional — si se manda, valida que el plan exista/esté activo (404 si no), crea la nueva membresía vía _crear_membresia y el pago queda vinculado a ella; mandar membresia_id y renovar_con_plan_id juntos es 400 (ambiguo); sin renovar_con_plan_id el comportamiento es idéntico al de la Rebanada 1
  - Rebanada 3 (Historial de pagos de un socio): completada — GET /socios/{id}/pagos protegido con require_rol("admin"), mismo patrón que GET /socios/{id}/membresias; 404 si el socio no existe; lista los pagos del socio ordenados por fecha descendente (más reciente primero), lista vacía (no error) si no tiene pagos
  - Rebanada 4 (Frontend para pagos): completada — sección "Pagos" en la ficha del socio (mismo patrón que "Membresía"): formulario "Registrar pago" con React Hook Form (monto, método, fecha opcional, checkbox "Renovar membresía con este pago" que muestra un selector de plan y manda renovar_con_plan_id), historial de pagos con React Query debajo; al registrar un pago exitoso invalida tanto ['pagos', id] como ['membresias', id] (por si renovó una); errores 404/400 del backend se muestran tal cual devuelve la API
- Tests automatizados: suite de pytest en backend/tests/ (login, require_rol, unicidad de socios/planes, cálculo de fecha_vencimiento, hybrid_property vencida, GET /socios/vencidos, registro de pagos, renovación de membresía vía pago, historial de pagos) con base de datos de test aislada (transacción + rollback por test); Vitest en el frontend para LoginPage (validación de campos, manejo de 401 vs 429). Ambas suites corren en el CI en cada push/PR a main.

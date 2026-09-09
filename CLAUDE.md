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
- Tests backend: pytest
- Tests frontend: npm test

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
- Sprint actual: Sprint 1
  - Rebanada 1 (Login y autenticación): completada — usuarios, JWT, cookie httpOnly, rate limiting; ver docs/adr/ y SECURITY.md
  - Rebanada 2 (Roles y protección de endpoints): completada — dependency require_rol reusable sobre get_current_user, endpoint de prueba GET /admin/ping
  - Rebanada 3 (Registrar un socio): completada — Socio gana documento (único) y telefono; POST /socios protegido con require_rol("admin"), valida duplicados de email/documento (409); formulario "Nuevo socio" en el frontend
  - Rebanada 4 (Listar y buscar socios): completada — GET /socios con búsqueda (ILIKE sobre nombre/email/documento) y paginación, protegido con require_rol("admin"); pantalla de lista con buscador debounced y estados vacíos claros

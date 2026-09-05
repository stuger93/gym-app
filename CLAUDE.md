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
- Sprint actual: Sprint 0 (setup fundacional)
- Historias completadas: 0.1 (Docker Compose con Postgres, backend y frontend) — incluye de facto 0.4 (endpoint /health)
- Historias pendientes del sprint: 0.3 (Alembic), 0.5 (CI con GitHub Actions)

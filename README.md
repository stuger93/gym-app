# Gym App

Sistema de gestión de gimnasio: alta y administración de socios, planes de membresía, asignación de planes y seguimiento de vencimientos. Backend en **FastAPI** + **PostgreSQL**, frontend en **React**.

## Cómo levantarlo localmente

### Requisitos
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) instalado y corriendo.

### Pasos

1. Copiar el archivo de variables de entorno de ejemplo:

   ```bash
   cp .env.example .env
   ```

   Ajustar los valores en `.env` si hace falta (por defecto ya trae valores de desarrollo funcionales). Este archivo nunca se sube a git.

2. Levantar todo el stack:

   ```bash
   docker compose up --build
   ```

   Esto levanta tres servicios: la base de datos PostgreSQL, la API backend y el frontend.

3. Aplicar las migraciones de base de datos (primera vez, o luego de traer cambios nuevos):

   ```bash
   docker compose exec backend alembic upgrade head
   ```

4. (Opcional) Crear el usuario admin inicial, leyendo `ADMIN_EMAIL`/`ADMIN_PASSWORD` desde `.env`:

   ```bash
   docker compose exec backend python -m app.seed
   ```

### URLs

| Servicio | URL |
|---|---|
| Frontend | http://localhost:5173 |
| API (backend) | http://localhost:8000 |
| Documentación interactiva de la API (Swagger) | http://localhost:8000/docs |

## Estructura del proyecto

```
.
├── backend/          # API en FastAPI: modelos, endpoints, autenticación, migraciones (Alembic)
├── frontend/         # Aplicación React (Vite): pantallas de administración y vista del socio
├── docs/adr/         # Architecture Decision Records: el porqué de decisiones técnicas clave
├── SECURITY.md        # Medidas de seguridad implementadas y mejoras pendientes identificadas
├── docker-compose.yml # Orquesta los tres servicios (db, backend, frontend) para desarrollo local
└── .env.example       # Plantilla de variables de entorno (sin secretos reales)
```

## Funcionalidades implementadas

### Sprint 0 — Base del proyecto
Entorno de desarrollo reproducible con Docker Compose, sistema de migraciones de base de datos y un pipeline de integración continua (CI) que valida el proyecto en cada cambio.

### Sprint 1 — Acceso y gestión de socios
- **Login** con roles de usuario (por ejemplo, administrador) y sesión segura.
- **Protección por rol**: cada función del sistema verifica del lado del servidor que el usuario tenga permiso, no solo que la pantalla se lo permita.
- **Alta de socios**, con validación de datos duplicados (no se puede repetir el email ni el documento de identidad).
- **Listado y búsqueda de socios**, con paginación para manejar volúmenes grandes.
- **Edición y baja de socios**: un socio dado de baja no se borra del sistema (queda su historial), simplemente deja de aparecer en el listado activo, y se puede reactivar.

### Sprint 2 — Planes de membresía y vencimientos
- **Definición de planes de membresía** (nombre, precio, duración, descripción), con posibilidad de desactivarlos sin perder el historial de quién los tuvo asignados.
- **Asignación de un plan a un socio**, calculando automáticamente la fecha de vencimiento. Se conserva el historial completo de planes que tuvo cada socio a lo largo del tiempo.
- **Detección automática de membresías vencidas**, con una pantalla dedicada para que el administrador vea de un vistazo a quién hay que contactar para renovar.
- **Vista propia para el socio**: un socio puede loguearse y ver únicamente el estado de su propia membresía (al día o vencida, con qué plan y hasta cuándo), sin acceso a la información de otros socios ni a las funciones de administración.

## Seguridad y decisiones de arquitectura

Este proyecto documenta explícitamente el razonamiento detrás de sus decisiones técnicas, especialmente las relacionadas con seguridad:

- **[SECURITY.md](SECURITY.md)** — resume qué medidas de seguridad están implementadas (hash de contraseñas, cookies de sesión seguras, límites de intentos de login, CORS restrictivo, etc.) y cuáles se identificaron como mejoras pendientes, con el criterio usado para priorizarlas.
- **[docs/adr/](docs/adr/)** — Architecture Decision Records, uno por decisión relevante:
  - [001 — Cookie httpOnly vs. localStorage para la sesión](docs/adr/001-cookie-httponly-vs-localstorage.md)
  - [002 — PyJWT vs. python-jose](docs/adr/002-pyjwt-vs-python-jose.md)
  - [003 — Tablas separadas para usuarios y socios](docs/adr/003-tablas-usuarios-y-socios-separadas.md)

Se recomienda revisar estos documentos para entender el porqué de las decisiones, no solo el qué.

## Cómo correr los tests y el linter

**Backend:**
```bash
docker compose exec backend pytest
docker compose exec backend ruff check .
```

**Frontend:**
```bash
docker compose exec frontend npm run lint
docker compose exec frontend npm run build
```

El proyecto todavía no cuenta con una suite de tests automatizados (ni `pytest` en el backend ni tests de componentes en el frontend); los comandos de arriba reflejan la convención definida para cuando se agreguen. Lo que sí corre hoy en cada `push` o pull request a `main` es el **pipeline de CI en GitHub Actions**, que valida automáticamente:
- Backend: lint con `ruff` y que las migraciones de Alembic apliquen limpio contra una base de datos nueva.
- Frontend: lint con `oxlint` y que el build de producción (`vite build`) compile sin errores.

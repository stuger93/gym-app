# ADR-001: Cookie httpOnly vs localStorage para el JWT de sesión

**Estado:** Aceptada
**Fecha:** 2026-09-06
**Contexto de la decisión:** Sprint 1, Rebanada 1 (Login y autenticación)

## Contexto

El endpoint `POST /login` necesita entregarle al frontend un token de sesión (JWT) que se use en cada request posterior para identificar al usuario autenticado. Hay dos formas estándar de manejar esto en una SPA: devolver el token en el body de la respuesta y que el frontend lo guarde en `localStorage` (o `sessionStorage`), o que el propio backend lo setee como cookie y el navegador lo envíe automáticamente en cada request.

`localStorage` es accesible desde cualquier script que corra en la página, lo que significa que si en algún momento se introduce una vulnerabilidad XSS (por ejemplo, una dependencia de frontend comprometida, o un campo de texto de usuario mal saneado que se renderiza sin escapar), un atacante puede leer el token directamente con JavaScript y robar la sesión.

## Decisión

El JWT se entrega como **cookie `httpOnly`** seteada por el backend en la respuesta de `POST /login` (`samesite=lax`, `secure` controlado por la variable de entorno `COOKIE_SECURE` — `true` en producción sobre HTTPS, `false` en desarrollo local sobre HTTP). El token **nunca** se devuelve en el body de la respuesta ni se guarda en `localStorage`.

Esto exige:
- Configurar `CORSMiddleware` con `allow_credentials=True` y un origen explícito (`FRONTEND_ORIGIN`, nunca `"*"`), porque los navegadores no permiten cookies en requests cross-origin con credenciales si el servidor responde con un wildcard.
- Que el cliente HTTP del frontend (instancia de `axios`) mande `withCredentials: true` en cada request, para que el navegador adjunte la cookie automáticamente.
- Un endpoint `GET /me` para que el frontend pueda preguntar "¿hay sesión activa?" sin necesidad de leer el token él mismo (porque no puede: es `httpOnly`).

## Alternativas consideradas

**Token en el body + `localStorage`.** Más simple de implementar (no requiere configurar cookies ni CORS con credentials), y es el patrón que muchos tutoriales muestran por defecto. Se descartó porque expone el token a robo vía XSS: cualquier script inyectado en la página puede leer `localStorage.getItem(...)` y exfiltrar la sesión sin que el usuario note nada.

## Consecuencias

- **Más seguro contra XSS**: un script malicioso no puede leer ni exfiltrar el token, porque el navegador no expone cookies `httpOnly` a JavaScript.
- **Más complejo de configurar**: hace falta CORS con credentials y origen explícito, y coordinar `withCredentials` en el cliente HTTP del frontend — más piezas que deben funcionar en conjunto.
- **Vulnerabilidad remanente**: las cookies (incluso `httpOnly`) son enviadas automáticamente por el navegador en cualquier request al dominio del backend, lo que abre la puerta a ataques CSRF. Hoy se mitiga parcialmente con `SameSite=Lax` (bloquea el envío de la cookie en la mayoría de los requests cross-site iniciados por terceros). Un token CSRF explícito queda documentado como mejora pendiente en `SECURITY.md`, a implementar antes de manejar pagos reales o de un despliegue a producción.
- **Requiere HTTPS en producción** para que `secure=true` tenga efecto real (la cookie no viaja en claro); esto queda como ítem del deploy checklist.

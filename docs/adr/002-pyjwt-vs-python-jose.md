# ADR-002: PyJWT vs python-jose para firmar y verificar JWT

**Estado:** Aceptada
**Fecha:** 2026-09-06
**Contexto de la decisión:** Sprint 1, Rebanada 1 (Login y autenticación)

## Contexto

El backend necesita una librería para generar y verificar los JWT que representan la sesión de un usuario autenticado. La propuesta inicial de la historia era usar `python-jose`, una librería históricamente popular en el ecosistema de FastAPI (aparece en buena parte de la documentación y tutoriales oficiales de terceros).

Al momento de implementar, se evaluó el estado de mantenimiento de `python-jose`: el proyecto ha tenido largos períodos sin releases y cargó en el pasado con vulnerabilidades de confusión de algoritmos (algorithm confusion) en su manejo de JWT, una clase de bug conocida y grave en librerías de este tipo (permite, en ciertas configuraciones, que un atacante fuerce la verificación de un token firmado con un algoritmo distinto al esperado).

## Decisión

Se usa **PyJWT** en lugar de `python-jose` para codificar (`jwt.encode`) y decodificar (`jwt.decode`) los tokens en `backend/app/auth.py`. PyJWT es la librería de JWT para Python más usada y activamente mantenida, con un historial de seguridad más sólido y una API mínima que reduce la superficie de configuración incorrecta (se fija explícitamente el algoritmo `HS256` tanto al firmar como al verificar).

## Alternativas consideradas

**`python-jose`** (propuesta original). Se descartó por menor actividad de mantenimiento reciente y por el antecedente de vulnerabilidades de confusión de algoritmos en su manejo de JWT — un riesgo que no vale la pena asumir en el componente que protege toda la autenticación del sistema.

## Consecuencias

- **Menor superficie de riesgo**: PyJWT es más simple (hace una cosa, JWT, y la hace bien) y no arrastra el historial de CVEs de `python-jose`.
- **Comunidad y mantenimiento**: al ser la librería de facto del ecosistema Python para JWT, es más fácil encontrar soporte y que las vulnerabilidades que aparezcan se parcheen rápido.
- **Sin impacto funcional**: la superficie usada (`encode`/`decode` con un secreto simétrico y algoritmo fijo `HS256`) es equivalente entre ambas librerías, por lo que el cambio no afecta el diseño de `create_access_token` ni de `get_current_user`.
- **A revisar a futuro**: si el proyecto necesitara JWT asimétricos (RS256) para validar tokens emitidos por un proveedor externo (ej. SSO), habría que confirmar que el soporte de PyJWT para esas curvas/algoritmos siga cubriendo la necesidad — hoy no aplica porque los tokens se emiten y verifican en el mismo backend con secreto compartido.

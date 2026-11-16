# La Trochita

Red social de ferromodelismo. TP 2 de Programación IV (UTN FRA, 2026 C2), individual.

- `front/` — Angular (S2 en adelante)
- `back/` — NestJS + MongoDB (Mongoose) + JWT + Cloudinary

Estado de los requerimientos: ver `REQUERIMIENTOS.md`.

## Back

### Cómo correrlo

```bash
cd back
npm install
cp .env.example .env      # completar MONGO_URI, JWT_SECRET y las claves de Cloudinary
npm run seed              # crea las cuentas de acceso rápido y publicaciones de ejemplo (se puede repetir sin problema)
npm run start:dev         # http://localhost:3000/api
```

`npm run build` compila. No hay tests automatizados: se prueba con Postman
(colección en `docs/postman/`, que no se sube al repositorio).

### Decisiones técnicas

- Rutas en español bajo `/api`. Errores con el formato de Nest: `{ statusCode, message, error }`.
- Token JWT (15 minutos) en el cuerpo de la respuesta; el front lo manda en el header `Authorization: Bearer <token>`.
  `venceEn` (fecha ISO) permite armar el contador del front.
- Contraseñas con `PasswordHasher` de `@nestjs/authentication`; el hash nunca sale en una respuesta.
- Validación con DTOs (`class-validator`) y `ValidationPipe` global con `whitelist`, `forbidNonWhitelisted` y `transform`.
- Imágenes de perfil en Cloudinary (JPG/PNG/WEBP, máx. 2 MB); solo se guarda la URL.
- Solo hay tres módulos, los del TP: `autenticacion`, `usuarios` y `publicaciones`. Las utilidades compartidas (subida a Cloudinary, validador de edad) están en `src/common/`, sin módulo.

### Rutas

| Método y ruta | Quién | Respuestas |
|---------------|-------|------------|
| `POST /api/autenticacion/registro` (multipart) | público | 201 · 400 · 409 |
| `POST /api/autenticacion/login` (JSON; cuenta deshabilitada: 403) | público | 200 · 400 · 401 · 403 |
| `POST /api/autenticacion/autorizar` (devuelve usuario, `emitidoEn` y `venceEn` del mismo token) | con token | 200 · 401 |
| `POST /api/autenticacion/refrescar` (token nuevo de 30 s) | con token | 200 · 401 |
| `GET /api/usuarios/yo` | con token | 200 · 401 |
| `PATCH /api/usuarios/yo` (multipart; no admite correo, perfil ni activo) | el propio usuario | 200 · 400 · 401 · 409 |
| `GET /api/usuarios/:id` (perfil público) | con token | 200 · 400 · 404 |
| `GET /api/usuarios?offset=&limit=` (con `perfil` y `activo`) | administrador | 200 · 400 · 401 · 403 |
| `POST /api/usuarios` (multipart: campos del registro + `perfil`) | administrador | 201 · 400 · 401 · 403 · 409 |
| `DELETE /api/usuarios/:id?ocultarPublicaciones=true\|false` (baja lógica) | administrador, no a sí mismo | 200 · 400 · 401 · 403 · 404 · 409 |
| `POST /api/usuarios/:id/rehabilitar` (vuelven las publicaciones ocultadas) | administrador | 200 · 400 · 401 · 403 · 404 · 409 |
| `POST /api/publicaciones` (multipart) | con token | 201 · 400 · 401 |
| `GET /api/publicaciones?orden=&usuario=&offset=&limit=` | con token | 200 · 400 · 401 |
| `GET /api/publicaciones/:id` | con token | 200 · 400 · 401 · 404 |
| `GET /api/publicaciones?usuario=&incluirBajas=true` (también las dadas de baja, con `estado`) | administrador | 200 · 400 · 401 · 403 |
| `GET /api/estadisticas/publicaciones-por-usuario`, `/comentarios-por-dia`, `/comentarios-por-publicacion` (query `desde`, `hasta` en `AAAA-MM-DD`, `estado` = `activas`\|`inactivas`\|`todas`) | administrador | 200 · 400 · 401 · 403 |
| `POST /api/publicaciones/:id/restaurar` (dar de alta otra vez) | administrador | 200 · 400 · 401 · 403 · 404 · 409 |
| `DELETE /api/publicaciones/:id` (baja lógica) | autor o administrador | 204 · 400 · 403 · 404 |
| `POST` y `DELETE /api/publicaciones/:id/me-gusta` | con token | 201 / 200 · 400 · 404 · 409 |
| `GET /api/publicaciones/:id/comentarios?offset=&limit=` (más recientes primero) | con token | 200 · 400 · 401 · 404 |
| `POST /api/publicaciones/:id/comentarios` (JSON `{ mensaje }`, 1 a 300 caracteres) | con token | 201 · 400 · 401 · 404 |
| `PUT /api/publicaciones/:id/comentarios/:comentarioId` (marca `modificado` si el mensaje cambió) | el autor | 200 · 400 · 401 · 403 · 404 |

Los listados devuelven `{ datos, total, offset, limit }` (`limit` 5 por defecto, máximo 20).

### Origen de las tecnologías

| Pieza | Origen |
|-------|--------|
| NestJS, Mongoose, `class-validator`, `@nestjs/config`, `@nestjs/jwt`, `PasswordHasher`, `@nestjs/mapped-types`, Cloudinary + Multer | clase |
| Guard que lee el header `Authorization` (en clase leía la cookie) | clase, con cambios |
| Excepciones HTTP de Nest en lugar de `throw new Error` | clase, con cambios |
| Script de seed | nuevo |

## Front

```bash
cd front
npm install
npm start        # http://localhost:4200 (la API tiene que estar corriendo en http://localhost:3000)
npm run build    # compila
```

La URL de la API está en `front/src/environments/environment.ts`.

### Decisiones técnicas

- Angular standalone con signals, Signal Forms, `@if/@for`, guards `canMatch` y carga diferida por ruta (igual que el TP 1).
- CSS propio con variables (`src/styles.css`), sin librerías de estilos. Identidad "Boletería de época": crema, verde locomotora y ocre; Playfair Display e Inter, Rye para los carteles y Courier Prime para fechas y chapas.
- Temática de ferromodelismo en el propio diseño, aunque una publicación no tenga foto: cada publicación es una placa de estación esmaltada montada en un diorama (postes, pasto, vía y zócalo con la fecha en una chapa de bronce), y cada comentario es un cartel chico con su poste. Todos los dibujos son SVG y CSS propios (`componentes/compartido/locomotora`, `cargando`, `escena-tren`); las animaciones se apagan con `prefers-reduced-motion`.
- El fondo de toda la app es una maqueta vista desde arriba (`componentes/compartido/fondo-maqueta`): pasto, árboles, casas, un camino, un río y la estación, con dos vías a los costados del contenido por las que pasa un tren. Se calcula según el tamaño de la ventana y nada queda detrás del panel del contenido (800 px).
- Navegación como una vía con estaciones (la locomotora se para en la pantalla actual), el me gusta como una señal ferroviaria (roja / verde), la insignia del administrador con una gorra de jefe de estación y el avatar de los perfiles dentro de un reloj de estación.
- El token dura **30 segundos** (fijo, para poder mostrarlo en la presentación; el enunciado pide 15 minutos). Login, registro y `POST /api/autenticacion/refrescar` devuelven `emitidoEn` y `venceEn`. Con eso, `services/auth.ts` programa dos temporizadores: a la mitad de la vida del token, un modal ofrece extender la sesión (si acepta, se llama a refrescar y se vuelve a programar todo); al vencer, se cierra la sesión sola, se lleva al login y se avisa con el modal «Tu sesión venció».
- Además, en cada acción del usuario (petición a la API o cambio de pantalla) se revisa si el token ya venció según `venceEn`: si venció, no se hace la petición y pasa lo mismo. Un 401 de la API también. Sin sesión, tampoco se envían peticiones.
- El token y su vencimiento se guardan en `localStorage`; un interceptor lo manda en `Authorization: Bearer`. Al abrir la app se muestra una pantalla de cargando (5 segundos como mínimo) mientras se valida el token con `POST /api/autenticacion/autorizar`; después los guards llevan a publicaciones o al login. El modal para extender la sesión tiene cuenta regresiva.
- Sin `alert()`: los avisos y confirmaciones usan el modal propio (`services/modal.ts`).
- Fechas en hora argentina con `Intl` nativo, mediante los pipes propios `tiempoRelativo`, `fechaArgentina` y `fechaChapa` («14 NOV 2026»). El pipe propio `resumen` acorta las descripciones de más de 200 caracteres en las listas (sin cortar palabras) y deja un «Ver más» que abre la publicación.
- Validaciones compartidas en `utilidades/validaciones.ts`: recortan los espacios igual que el back y usan las mismas reglas y mensajes (correo con la misma exigencia de dominio que `@IsEmail()`, edad mínima con la fecha argentina).
- Paginación con «Anterior» / «Siguiente»; después de crear o eliminar se vuelve a pedir la página a la API para que el total siempre coincida.
- Las validaciones del front son las mismas que las del back (el back es la que manda).

### Rutas del front

| Ruta | Guard | Pantalla |
|------|-------|----------|
| `/login`, `/registro` | solo sin sesión | Login (con acceso rápido) y registro |
| `/publicaciones`, `/perfil` | con sesión | Publicaciones (listado, orden, paginación, crear, me gusta y eliminar) y Mi perfil (ver, editar y mis últimas publicaciones con comentarios) |
| `/dashboard/estadisticas` | administrador | Tres gráficos con Chart.js (torta: publicaciones por usuario; líneas: comentarios por día; barras: comentarios por publicación) con un lapso y el estado de las publicaciones elegibles |
| `/dashboard/usuarios`, `/dashboard/usuarios/nuevo` | administrador | Planilla de usuarios paginada (perfil y estado), alta con el mismo formulario del registro más el perfil, deshabilitar (eligiendo si se ocultan sus publicaciones) y rehabilitar |
| `/publicaciones/:id` | con sesión | Una publicación en grande (diorama), comentar, comentarios de a 3 con «cargar más» (descarta repetidos por id) y editar los propios en el mismo cartel. Se llega desde el título o «N comentarios» de cualquier placa |
| `/usuarios/:id` | con sesión | Perfil público de otro usuario y sus publicaciones |
| `/sin-permiso` | — | Falta de permiso |
| `**` | — | 404 |

## Despliegue

Front y back están en **Vercel** (dos proyectos del mismo repositorio), la base en **MongoDB Atlas** y las imágenes en **Cloudinary**.

| Parte | URL | Root Directory |
|-------|-----|----------------|
| Front | https://front-taupe-six.vercel.app | `front` |
| Back (API) | https://red-social-nu-five.vercel.app/api | `back` |

- **Back:** Vercel detecta NestJS por `src/main.ts`. Variables de entorno en el panel del proyecto: `MONGO_URI`, `JWT_SECRET`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `IMAGEN_PERFIL_DEFECTO` y `FRONT_URL` (la URL del front; admite varias separadas por coma). Atlas tiene que permitir `0.0.0.0/0`, porque Vercel no tiene IP fija.
- **Front:** el build de producción reemplaza `environment.ts` por `environment.production.ts` (URL del back). `front/vercel.json` manda todas las rutas a `index.html` para que recargar una ruta no dé 404. *Output Directory*: `dist/front/browser`.
- Se despliega solo con cada `git push`. Como el token viaja en el header `Authorization`, front y back pueden estar en dominios distintos.
- El seed (`npm run seed`) se corre una vez desde la computadora, con el `MONGO_URI` de la base de producción.

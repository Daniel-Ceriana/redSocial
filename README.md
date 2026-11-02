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
| `POST /api/autenticacion/login` (JSON) | público | 200 · 400 · 401 |
| `GET /api/usuarios/yo` | con token | 200 · 401 |
| `PATCH /api/usuarios/yo` (multipart; no admite correo, perfil ni activo) | el propio usuario | 200 · 400 · 401 · 409 |
| `GET /api/usuarios/:id` (perfil público) | con token | 200 · 400 · 404 |
| `POST /api/publicaciones` (multipart) | con token | 201 · 400 · 401 |
| `GET /api/publicaciones?orden=&usuario=&offset=&limit=` | con token | 200 · 400 · 401 |
| `DELETE /api/publicaciones/:id` (baja lógica) | autor o administrador | 204 · 400 · 403 · 404 |
| `POST` y `DELETE /api/publicaciones/:id/me-gusta` | con token | 201 / 200 · 400 · 404 · 409 |
| `GET /api/publicaciones/:id/comentarios?offset=&limit=` | con token | 200 · 400 · 404 |

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
- CSS propio con variables (`src/styles.css`). Identidad "Estación antigua": crema, verde locomotora y ocre; Playfair Display e Inter.
- En cada acción del usuario (petición a la API o cambio de pantalla) se revisa si el token ya venció según `venceEn`: si venció, no se hace la petición, se cierra la sesión, se lleva al login y se avisa con el modal «Tu sesión venció». Un 401 de la API hace lo mismo. Sin sesión, tampoco se envían peticiones.
- El token y su vencimiento se guardan en `localStorage`; un interceptor lo manda en `Authorization: Bearer`. Al abrir la app se valida con `GET /api/usuarios/yo`.
- Sin `alert()`: los avisos y confirmaciones usan el modal propio (`services/modal.ts`).
- Fechas en hora argentina con `Intl` nativo, mediante los pipes propios `tiempoRelativo` y `fechaArgentina`.
- Paginación con «Anterior» / «Siguiente»; después de crear o eliminar se vuelve a pedir la página a la API para que el total siempre coincida.
- Las validaciones del front son las mismas que las del back (el back es la que manda).

### Rutas del front

| Ruta | Guard | Pantalla |
|------|-------|----------|
| `/login`, `/registro` | solo sin sesión | Login (con acceso rápido) y registro |
| `/publicaciones`, `/perfil` | con sesión | Publicaciones (listado, orden, paginación, crear, me gusta y eliminar) y Mi perfil (ver, editar y mis últimas publicaciones con comentarios) |
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

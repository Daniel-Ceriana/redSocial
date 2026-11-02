# Requerimientos — La Trochita

Estado: ⬜ pendiente · 🟨 parcial · ✔ hecho. Detalle de cada uno en `docs/HOJA_DE_RUTA.md`.

## Sprint 1

| ID | Requerimiento | Estado |
|----|---------------|--------|
| 1.B1 | Proyecto NestJS conectado a MongoDB | ✔ |
| 1.B2 | Módulos `publicaciones`, `autenticacion` y `usuarios` | ✔ (`publicaciones` vacío hasta la S4) |
| 1.B3 | `POST /api/autenticacion/registro` (con imagen en Cloudinary) | ✔ |
| 1.B4 | `POST /api/autenticacion/login` por correo | ✔ |
| 1.B5 | Atributo `perfil` (usuario por defecto / administrador) | ✔ |
| 1.B6 | JWT en login y registro + guard (`GET /api/usuarios/yo`) | ✔ |
| 1.F1 | Proyecto Angular creado | ✔ |
| 1.F2 | Pantallas Registro, Login, Publicaciones y Mi perfil | ✔ |
| 1.F3 | Navegación con todos los guards | ✔ |
| 1.F4 | Favicon propio (`public/favicon.svg`) | ✔ |
| 1.F5 | Login por correo con validaciones y mensajes | ✔ |
| 1.F6 | Registro con validaciones y mensajes | ✔ |
| 1.F7 | Botones de acceso rápido que completan el formulario | ✔ |
| 1.F8 | Deploy (front y back en Vercel, base en Atlas) | ✔ |

## Sprint 2

| ID | Requerimiento | Estado |
|----|---------------|--------|
| 2.B1 | `POST /api/publicaciones` (título, descripción, imagen opcional) | ✔ |
| 2.B2 | `DELETE /api/publicaciones/:id` (baja lógica, autor o administrador) | ✔ |
| 2.B3 | `GET /api/publicaciones` (últimas primero, orden por fecha o me gusta, filtro por usuario, `offset` y `limit`) | ✔ |
| 2.B4 | `POST /api/publicaciones/:id/me-gusta` (uno por usuario) | ✔ |
| 2.B5 | `DELETE /api/publicaciones/:id/me-gusta` (solo si lo había dado) | ✔ |
| 2.B6 | `GET /api/publicaciones/:id/comentarios` (paginado, más recientes primero) | ✔ |
| 2.F1 | Listado ordenado por fecha, con opción de ordenar por me gusta | 🟨 compilado; falta probarlo en el navegador |
| 2.F2 | Cantidad limitada por carga, con paginación (5 por página) | 🟨 ídem |
| 2.F3 | Cada publicación es un componente | 🟨 ídem |
| 2.F4 | Dar y quitar me gusta según corresponda | 🟨 ídem |
| 2.F5 | Eliminar mis publicaciones (con modal de confirmación) | 🟨 ídem |
| 2.F8 | Formulario para crear una publicación (título, descripción, imagen con vista previa) | 🟨 ídem |
| 2.F6, 2.F7, 2.F9 | Mi perfil completo y edición | ⬜ (S6) |

## Agregados aprobados

| ID | Agregado | Estado |
|----|----------|--------|
| X7 | Nombre de usuario único (409) | ✔ |
| X8 | Imagen: opcional, JPG/PNG/WEBP, 2 MB, imagen por defecto desde `IMAGEN_PERFIL_DEFECTO` | ✔ |
| X9 | Edad mínima 13 años y fecha no futura | ✔ |
| X10 | Seed (`npm run seed`) | ✔ |
| X18 | La contraseña nunca se devuelve | ✔ |
| X20 | JWT adelantado al sprint 1 (back) | ✔ |
| X21 | Colección de Postman en `docs/postman/` | ✔ |
| X3 | Cerrar sesión en la barra de navegación | ✔ |
| X5 | Página 404 y pantalla "sin permiso" | ✔ |
| X4 | Datos para la tarjeta: `yoMeGusta`, `cantidadMeGusta`, `cantidadComentarios` | ✔ back · 🟨 front |
| X6 | Comentarios adelantados al sprint 2 (esquema y lectura) | ✔ |
| X19 | La publicación usa `descripcion`; los comentarios usan `mensaje` | ✔ |

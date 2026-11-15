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
| 2.F6 | Mi perfil: todos los datos y la foto | 🟨 compilado; falta probarlo en el navegador |
| 2.F7 | Mi perfil: mis últimas 3 publicaciones con sus comentarios | 🟨 ídem |
| 2.F9 | Editar mi perfil (`PATCH /api/usuarios/yo` + formulario). El correo no se puede cambiar. | ✔ back · 🟨 front |

## Sprint 3 (adelantado)

| ID | Requerimiento | Estado |
|----|---------------|--------|
| 3.F8 | Cualquier respuesta 401 lleva al login | ✔ también al vencer el token, sin esperar una acción |
| X13 | Aviso y cierre de sesión cuando vence el token | 🟨 adelantado; falta probarlo en el navegador |
| 3.B1 | GET comentarios paginado, más recientes primero | ✔ offset y limit (revisado en la S7) |
| 3.B2 | POST comentario con autor y fecha | ✔ S7 |
| 3.B3 | PUT comentario (solo el autor, marca `modificado`) | ✔ S7 |
| 3.B4 | El JWT lleva identidad y perfil | ✔ `{ sub, correo, perfil }` |
| 3.B6 | POST autorizar | ✔ S7 |
| 3.B7 | Refrescar el token (`POST /api/autenticacion/refrescar`) | ✔ con token de 30 s |
| X17 | GET una publicación por id | ✔ S7 |
| 3.F1 | Página de la publicación en grande con sus comentarios | ✔ S8 (`/publicaciones/:id`) |
| 3.F2 | Escribir comentarios | ✔ S8 |
| 3.F3 | Comentarios uno debajo del otro, de a 3 con «cargar más» | ✔ S8 |
| 3.F4 | El autor edita su comentario; se marca «editado» | ✔ S8 |
| 3.F7 | Ofrecer extender la sesión antes de que venza | ✔ a la mitad de los 30 s, con cuenta regresiva |
| 3.B5 | El token vence a los 15 minutos | 🟨 decisión: 30 s fijos para la presentación |
| 3.F5 | Login y registro guardan el token | ✔ `localStorage` (T9) |
| 3.F6 | Pantalla de cargando al iniciar que valida con autorizar | ✔ S9 (mínimo 5 s) |

## Sprint 4

| ID | Requerimiento | Estado |
|----|---------------|--------|
| 4.B1 | Rutas de usuarios solo para administradores (perfil del token) | ✔ S10 (`SoloAdministradorGuard`) |
| 4.B2 | `GET /api/usuarios` (paginado) | ✔ S10 |
| 4.B3 | `POST /api/usuarios` con perfil usuario o administrador | ✔ S10 |
| 4.B4 | `DELETE /api/usuarios/:id` (baja lógica); al ingresar se avisa que está deshabilitado (403) | ✔ S10 (el administrador elige si se ocultan sus publicaciones) |
| 4.B5 | `POST /api/usuarios/:id/rehabilitar` | ✔ S10 (vuelven las publicaciones que se habían ocultado) |
| X14 | Un deshabilitado con la sesión abierta no puede autorizar ni refrescar (403) | ✔ S10 |
| X15 | Un administrador no puede deshabilitarse a sí mismo (400) | ✔ S10 |
| X16 | Publicaciones de un deshabilitado: las oculta o no el administrador al deshabilitarlo | ✔ S10 |

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
| X11 | Ver el perfil público de otro usuario (`GET /api/usuarios/:id` + `/usuarios/:id`) | ✔ back · 🟨 front |

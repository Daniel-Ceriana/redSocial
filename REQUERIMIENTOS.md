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
| 1.F2 | Pantallas Registro, Login, Publicaciones y Mi perfil | 🟨 compiladas; falta probarlas en el navegador |
| 1.F3 | Navegación con todos los guards | 🟨 ídem |
| 1.F4 | Favicon propio (`public/favicon.svg`) | ✔ |
| 1.F5 | Login por correo con validaciones y mensajes | 🟨 ídem |
| 1.F6 | Registro con validaciones y mensajes | 🟨 ídem |
| 1.F7 | Botones de acceso rápido que completan el formulario | 🟨 ídem |
| 1.F8 | Deploy | ⬜ (S3) |

## Agregados aprobados en la S1

| ID | Agregado | Estado |
|----|----------|--------|
| X7 | Nombre de usuario único (409) | ✔ |
| X8 | Imagen: opcional, JPG/PNG/WEBP, 2 MB, imagen por defecto desde `IMAGEN_PERFIL_DEFECTO` | ✔ |
| X9 | Edad mínima 13 años y fecha no futura | ✔ back · 🟨 front |
| X10 | Seed (`npm run seed`) | ✔ |
| X18 | La contraseña nunca se devuelve | ✔ |
| X20 | JWT adelantado al sprint 1 (back) | ✔ |
| X21 | Colección de Postman en `docs/postman/` | ✔ |
| X3 | Cerrar sesión en la barra de navegación | 🟨 |
| X5 | Página 404 y pantalla "sin permiso" | 🟨 |

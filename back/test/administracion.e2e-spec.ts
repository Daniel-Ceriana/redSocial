import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { crearApp, crearYLoguear, type AppDePrueba } from './ayudas.js';

let t: AppDePrueba;
let usuario: Awaited<ReturnType<typeof crearYLoguear>>;
let admin: Awaited<ReturnType<typeof crearYLoguear>>;
let victima: Awaited<ReturnType<typeof crearYLoguear>>;

beforeAll(async () => {
  t = await crearApp();
  usuario = await crearYLoguear(t, 'comun');
  admin = await crearYLoguear(t, 'jefe', 'administrador');
  victima = await crearYLoguear(t, 'victima');
}, 120_000);
afterAll(() => t?.cerrar());

const ID_CUALQUIERA = '64b7f0f0f0f0f0f0f0f0f0f0';

describe('rutas de administrador: un usuario común recibe 403', () => {
  const rutas: ['get' | 'post' | 'delete', string][] = [
    ['get', '/api/usuarios'],
    ['post', '/api/usuarios'],
    ['delete', `/api/usuarios/${ID_CUALQUIERA}?ocultarPublicaciones=false`],
    ['post', `/api/usuarios/${ID_CUALQUIERA}/rehabilitar`],
    ['post', `/api/publicaciones/${ID_CUALQUIERA}/restaurar`],
    ['get', '/api/estadisticas/publicaciones-por-usuario'],
    ['get', '/api/estadisticas/comentarios-por-dia'],
    ['get', '/api/estadisticas/comentarios-por-publicacion'],
  ];

  it.each(rutas)('%s %s', async (metodo, ruta) => {
    await t.http()[metodo](ruta).set(usuario.auth).expect(403);
  });

  it('y sin token, 401', async () => {
    await t.http().get('/api/usuarios').expect(401);
    await t.http().get('/api/estadisticas/comentarios-por-dia').expect(401);
  });
});

describe('administrador', () => {
  it('lista los usuarios (paginado) y ve las estadísticas', async () => {
    const lista = await t.http().get('/api/usuarios?limit=2').set(admin.auth).expect(200);
    expect(lista.body).toMatchObject({ total: 3, limit: 2 });
    expect(lista.body.datos).toHaveLength(2);
    const estadisticas = '/api/estadisticas/publicaciones-por-usuario';
    await t.http().get(estadisticas).set(admin.auth).expect(400); // faltan desde y hasta
    await t.http().get(`${estadisticas}?desde=2026-01-01&hasta=2026-01-31`).set(admin.auth).expect(200);
  });

  it('no puede deshabilitarse a sí mismo (400) y tiene que elegir qué pasa con las publicaciones (400)', async () => {
    await t.http().delete(`/api/usuarios/${admin.id}?ocultarPublicaciones=true`).set(admin.auth).expect(400);
    await t.http().delete(`/api/usuarios/${victima.id}`).set(admin.auth).expect(400);
  });

  it('al deshabilitar a alguien, su token deja de servir en la siguiente petición (403 CUENTA_DESHABILITADA)', async () => {
    await t.http().get('/api/usuarios/yo').set(victima.auth).expect(200);
    await t.http().delete(`/api/usuarios/${victima.id}?ocultarPublicaciones=true`).set(admin.auth).expect(200);

    const res = await t.http().get('/api/usuarios/yo').set(victima.auth).expect(403);
    expect(res.body.codigo).toBe('CUENTA_DESHABILITADA');
    await t.http().post('/api/autenticacion/refrescar').set(victima.auth).expect(403);
    await t.http().delete(`/api/usuarios/${victima.id}?ocultarPublicaciones=true`).set(admin.auth).expect(409);
  });

  it('al rehabilitarlo, el mismo token vuelve a funcionar', async () => {
    await t.http().post(`/api/usuarios/${victima.id}/rehabilitar`).set(admin.auth).expect(200);
    await t.http().get('/api/usuarios/yo').set(victima.auth).expect(200);
  });
});

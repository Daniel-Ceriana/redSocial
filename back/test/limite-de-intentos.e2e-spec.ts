import { afterAll, beforeAll, expect, it } from 'vitest';
import { crearApp, type AppDePrueba } from './ayudas.js';

// Archivo aparte: este test agota el límite de intentos de login y no puede compartir la app con otros
let t: AppDePrueba;
beforeAll(async () => {
  t = await crearApp();
}, 120_000);
afterAll(() => t?.cerrar());

it('el 6.º intento de login en un minuto recibe 429', async () => {
  const intento = () => t.http().post('/api/autenticacion/login').send({ correo: 'nadie@test.com', contrasena: 'Equivocada1' });
  for (let i = 0; i < 5; i++) await intento().expect(401);
  await intento().expect(429);
});

it('la API manda las cabeceras de seguridad de Helmet', async () => {
  const res = await t.http().get('/api/usuarios/yo');
  expect(res.headers['x-content-type-options']).toBe('nosniff');
  expect(res.headers['x-powered-by']).toBeUndefined();
});

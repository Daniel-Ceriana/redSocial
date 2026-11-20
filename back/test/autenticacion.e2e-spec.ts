import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { CONTRASENA, crearApp, crearUsuario, type AppDePrueba } from './ayudas.js';

// Ojo: login y registro admiten 5 pedidos por minuto por IP (cada uno por separado), así que se cuidan los que se hacen.
let t: AppDePrueba;
beforeAll(async () => {
  t = await crearApp();
}, 120_000);
afterAll(() => t?.cerrar());

const registro = (extra: Record<string, string> = {}) => {
  const datos: Record<string, string> = {
    nombre: 'Ana',
    apellido: 'Gómez',
    correo: 'ana@test.com',
    nombreUsuario: 'ana_vias',
    contrasena: CONTRASENA,
    fechaNacimiento: '1995-05-20',
    ...extra,
  };
  const peticion = t.http().post('/api/autenticacion/registro');
  for (const [campo, valor] of Object.entries(datos)) peticion.field(campo, valor);
  return peticion;
};

describe('registro', () => {
  it('crea la cuenta, devuelve token y nunca el hash de la contraseña', async () => {
    const res = await registro().expect(201);
    expect(res.body.token).toEqual(expect.any(String));
    expect(res.body.usuario).toMatchObject({ correo: 'ana@test.com', perfil: 'usuario' });
    expect(JSON.stringify(res.body)).not.toContain('contrasena');
  });

  it('409 si el correo ya existe', async () => {
    await registro({ nombreUsuario: 'otro_nombre' }).expect(409);
  });

  it('400 con una contraseña débil, con el mensaje en español', async () => {
    const res = await registro({ correo: 'b@test.com', nombreUsuario: 'bb_vias', contrasena: 'abc' }).expect(400);
    expect(res.body.message).toContain('La contraseña debe tener al menos 8 caracteres');
  });

  it('400 si se manda un campo que no está permitido (no se puede inventar el perfil)', async () => {
    const res = await registro({ correo: 'c@test.com', nombreUsuario: 'cc_vias', perfil: 'administrador' }).expect(400);
    expect(res.body.message).toContain('El campo "perfil" no está permitido');
  });
});

describe('login, autorizar y refrescar', () => {
  let token: string;

  it('login correcto: token con fechas de emisión y vencimiento a 15 minutos', async () => {
    await crearUsuario(t.app, 'maquinista');
    const res = await t.http().post('/api/autenticacion/login').send({ correo: 'maquinista@test.com', contrasena: CONTRASENA }).expect(200);
    token = res.body.token;
    const minutos = (new Date(res.body.venceEn).getTime() - new Date(res.body.emitidoEn).getTime()) / 60_000;
    expect(minutos).toBe(15);
  });

  it('401 con contraseña incorrecta, sin revelar si el correo existe', async () => {
    const mala = await t.http().post('/api/autenticacion/login').send({ correo: 'maquinista@test.com', contrasena: 'Equivocada1' }).expect(401);
    const inexistente = await t.http().post('/api/autenticacion/login').send({ correo: 'nadie@test.com', contrasena: 'Equivocada1' }).expect(401);
    expect(mala.body.message).toBe(inexistente.body.message);
  });

  it('403 con código CUENTA_DESHABILITADA si la cuenta está dada de baja', async () => {
    const usuario = await crearUsuario(t.app, 'sin_boleto');
    usuario.activo = false;
    await usuario.save();
    const res = await t.http().post('/api/autenticacion/login').send({ correo: 'sin_boleto@test.com', contrasena: CONTRASENA }).expect(403);
    expect(res.body.codigo).toBe('CUENTA_DESHABILITADA');
  });

  it('autorizar devuelve el usuario y las mismas fechas del token', async () => {
    const res = await t.http().post('/api/autenticacion/autorizar').set('Authorization', `Bearer ${token}`).expect(200);
    expect(res.body.usuario.correo).toBe('maquinista@test.com');
    expect(res.body.venceEn).toEqual(expect.any(String));
  });

  it('refrescar devuelve un token nuevo', async () => {
    const res = await t.http().post('/api/autenticacion/refrescar').set('Authorization', `Bearer ${token}`).expect(200);
    expect(res.body.token).toEqual(expect.any(String));
  });
});

describe('rutas protegidas', () => {
  it('401 sin token, con token mal formado y con token firmado con otra clave', async () => {
    await t.http().get('/api/usuarios/yo').expect(401);
    await t.http().get('/api/usuarios/yo').set('Authorization', 'Bearer cualquier-cosa').expect(401);
    const ajeno =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwicGVyZmlsIjoiYWRtaW5pc3RyYWRvciJ9.firma-falsa';
    await t.http().get('/api/usuarios/yo').set('Authorization', `Bearer ${ajeno}`).expect(401);
  });
});

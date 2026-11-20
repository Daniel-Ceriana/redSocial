import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PNG, crearApp, crearYLoguear, type AppDePrueba } from './ayudas.js';

let t: AppDePrueba;
let ana: Awaited<ReturnType<typeof crearYLoguear>>;
let beto: Awaited<ReturnType<typeof crearYLoguear>>;
let admin: Awaited<ReturnType<typeof crearYLoguear>>;
let publicacionId: string;

beforeAll(async () => {
  t = await crearApp();
  ana = await crearYLoguear(t, 'ana');
  beto = await crearYLoguear(t, 'beto');
  admin = await crearYLoguear(t, 'jefe', 'administrador');
}, 120_000);
afterAll(() => t?.cerrar());

const crearPublicacion = (auth: Record<string, string>, titulo: string) =>
  t.http().post('/api/publicaciones').set(auth).field('titulo', titulo).field('descripcion', 'Una maqueta');

describe('crear y listar', () => {
  it('401 sin token', async () => {
    await t.http().post('/api/publicaciones').field('titulo', 'x').expect(401);
    await t.http().get('/api/publicaciones').expect(401);
  });

  it('crea una publicación a nombre de quien tiene la sesión', async () => {
    const res = await crearPublicacion(ana.auth, 'Mi primer diorama').expect(201);
    publicacionId = res.body.id;
    expect(res.body).toMatchObject({ titulo: 'Mi primer diorama', estado: 'activa' });
    expect(res.body.autor.id).toBe(ana.id);
  });

  it('400 sin título', async () => {
    await t.http().post('/api/publicaciones').set(ana.auth).field('descripcion', 'sin título').expect(400);
  });

  it('acepta una imagen real (y la guarda como URL) y rechaza un archivo que no es una imagen', async () => {
    const ok = await t
      .http()
      .post('/api/publicaciones')
      .set(ana.auth)
      .field('titulo', 'Con foto')
      .attach('imagen', PNG, { filename: 'foto.png', contentType: 'image/png' })
      .expect(201);
    expect(ok.body.imagen).toBe('https://imagenes.test/foto.png');

    const mala = await t
      .http()
      .post('/api/publicaciones')
      .set(ana.auth)
      .field('titulo', 'Falsa')
      .attach('imagen', Buffer.from('no soy una imagen'), { filename: 'x.png', contentType: 'image/png' })
      .expect(400);
    expect(JSON.stringify(mala.body.message)).toContain('La imagen debe ser JPG, PNG o WEBP');
  });

  it('lista paginado, con las últimas primero', async () => {
    for (const titulo of ['Segunda', 'Tercera', 'Cuarta', 'Quinta', 'Sexta']) {
      await crearPublicacion(beto.auth, titulo).expect(201);
    }
    const res = await t.http().get('/api/publicaciones?limit=3').set(ana.auth).expect(200);
    expect(res.body).toMatchObject({ total: 7, offset: 0, limit: 3 });
    expect(res.body.datos.map((p: { titulo: string }) => p.titulo)).toEqual(['Sexta', 'Quinta', 'Cuarta']);
  });

  it('400 si el límite pasa el máximo (20)', async () => {
    await t.http().get('/api/publicaciones?limit=100').set(ana.auth).expect(400);
  });

  it('404 si el id no existe y 400 si no es un id válido', async () => {
    await t.http().get('/api/publicaciones/64b7f0f0f0f0f0f0f0f0f0f0').set(ana.auth).expect(404);
    await t.http().get('/api/publicaciones/no-es-un-id').set(ana.auth).expect(400);
  });
});

describe('me gusta', () => {
  it('se da una sola vez (409 si se repite) y se puede quitar', async () => {
    const url = `/api/publicaciones/${publicacionId}/me-gusta`;
    const dado = await t.http().post(url).set(beto.auth).expect(201);
    expect(dado.body).toEqual({ cantidadMeGusta: 1, yoMeGusta: true });
    await t.http().post(url).set(beto.auth).expect(409);
    const quitado = await t.http().delete(url).set(beto.auth).expect(200);
    expect(quitado.body).toEqual({ cantidadMeGusta: 0, yoMeGusta: false });
    await t.http().delete(url).set(beto.auth).expect(409);
  });
});

describe('comentarios', () => {
  let comentarioId: string;
  const url = () => `/api/publicaciones/${publicacionId}/comentarios`;

  it('crea un comentario y lo lista', async () => {
    const creado = await t.http().post(url()).set(beto.auth).send({ mensaje: '¡Muy lindo!' }).expect(201);
    comentarioId = creado.body.id;
    const lista = await t.http().get(url()).set(ana.auth).expect(200);
    expect(lista.body.total).toBe(1);
    expect(lista.body.datos[0].mensaje).toBe('¡Muy lindo!');
  });

  it('400 con un mensaje vacío o de más de 300 caracteres', async () => {
    await t.http().post(url()).set(beto.auth).send({ mensaje: '   ' }).expect(400);
    await t.http().post(url()).set(beto.auth).send({ mensaje: 'a'.repeat(301) }).expect(400);
  });

  it('solo el autor edita su comentario (403 para otro) y queda marcado como modificado', async () => {
    await t.http().put(`${url()}/${comentarioId}`).set(ana.auth).send({ mensaje: 'Lo cambio yo' }).expect(403);
    const editado = await t
      .http()
      .put(`${url()}/${comentarioId}`)
      .set(beto.auth)
      .send({ mensaje: 'Muy lindo, de verdad' })
      .expect(200);
    expect(editado.body.modificado).toBe(true);
  });
});

describe('baja lógica', () => {
  it('solo el autor o un administrador pueden eliminar (403 para otro usuario)', async () => {
    await t.http().delete(`/api/publicaciones/${publicacionId}`).set(beto.auth).expect(403);
  });

  it('al eliminarla, desaparece para los usuarios pero el administrador la ve como baja', async () => {
    await t.http().delete(`/api/publicaciones/${publicacionId}`).set(ana.auth).expect(204);
    await t.http().get(`/api/publicaciones/${publicacionId}`).set(beto.auth).expect(404);

    const normal = await t.http().get('/api/publicaciones?limit=20').set(beto.auth).expect(200);
    expect(normal.body.datos.some((p: { id: string }) => p.id === publicacionId)).toBe(false);

    const deAdmin = await t
      .http()
      .get(`/api/publicaciones?usuario=${ana.id}&incluirBajas=true`)
      .set(admin.auth)
      .expect(200);
    const baja = deAdmin.body.datos.find((p: { id: string }) => p.id === publicacionId);
    expect(baja.estado).not.toBe('activa');
  });

  it('un usuario común no puede pedir las bajas (403) ni restaurar (403)', async () => {
    await t.http().get(`/api/publicaciones?usuario=${ana.id}&incluirBajas=true`).set(ana.auth).expect(403);
    await t.http().post(`/api/publicaciones/${publicacionId}/restaurar`).set(ana.auth).expect(403);
  });

  it('el administrador la restaura y vuelve a verse (409 si ya estaba activa)', async () => {
    await t.http().post(`/api/publicaciones/${publicacionId}/restaurar`).set(admin.auth).expect(200);
    await t.http().get(`/api/publicaciones/${publicacionId}`).set(beto.auth).expect(200);
    await t.http().post(`/api/publicaciones/${publicacionId}/restaurar`).set(admin.auth).expect(409);
  });
});

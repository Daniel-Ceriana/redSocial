import type { INestApplication } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import { ArchivosService } from '../src/common/archivos.service.js';
import { configurarApp } from '../src/configurar-app.js';
import type { Perfil } from '../src/usuarios/entities/usuario.entity.js';
import { UsuariosService } from '../src/usuarios/usuarios.service.js';

export const CONTRASENA = 'Trochita123';

// PNG de 1x1 píxel: una imagen real, porque Nest comprueba el tipo por el contenido y no por la extensión
export const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGNgYGD4DwABBAEAHnOcQAAAAABJRU5ErkJggg==',
  'base64',
);

export interface AppDePrueba {
  app: INestApplication;
  http: () => ReturnType<typeof request>;
  cerrar: () => Promise<void>;
}

// Levanta la app completa (los mismos módulos y la misma configuración que en producción) contra una
// MongoDB en memoria. Lo único que se reemplaza es Cloudinary: no se sube nada a internet.
export async function crearApp(): Promise<AppDePrueba> {
  const mongo = await MongoMemoryServer.create();
  process.env.MONGO_URI = mongo.getUri('trochita_test');
  process.env.JWT_SECRET = 'secreto-solo-para-tests';

  // Import dinámico: AppModule tiene que leer las variables de entorno de arriba
  const { AppModule } = await import('../src/app.module.js');
  const modulo = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(ArchivosService)
    .useValue({ subirImagen: async () => 'https://imagenes.test/foto.png' })
    .compile();

  const app = modulo.createNestApplication<NestExpressApplication>();
  configurarApp(app);
  await app.init();

  return {
    app,
    http: () => request(app.getHttpServer()),
    cerrar: async () => {
      await app.close();
      await mongo.stop();
    },
  };
}

// Crea una cuenta directo en la base (sin pasar por la API, que tiene límite de intentos)
export async function crearUsuario(
  app: INestApplication,
  nombreUsuario: string,
  perfil: Perfil = 'usuario',
) {
  return app.get(UsuariosService).crear(
    {
      nombre: nombreUsuario,
      apellido: 'Prueba',
      correo: `${nombreUsuario}@test.com`,
      nombreUsuario,
      contrasena: CONTRASENA,
      fechaNacimiento: '2000-01-01',
      descripcion: '',
      imagenPerfil: '',
    },
    perfil,
  );
}

// Crea la cuenta, inicia sesión por la API y devuelve el token con el encabezado listo para supertest
export async function crearYLoguear(
  { app, http }: AppDePrueba,
  nombreUsuario: string,
  perfil: Perfil = 'usuario',
) {
  const usuario = await crearUsuario(app, nombreUsuario, perfil);
  const res = await http()
    .post('/api/autenticacion/login')
    .send({ correo: `${nombreUsuario}@test.com`, contrasena: CONTRASENA })
    .expect(200);
  const token = res.body.token as string;
  return { id: usuario.id as string, token, auth: { Authorization: `Bearer ${token}` } };
}

import dns from 'node:dns';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { getModelToken } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AppModule } from './app.module.js';
import { UsuariosService } from './usuarios/usuarios.service.js';
import { Perfil } from './usuarios/entities/usuario.entity.js';
import { Publicacion } from './publicaciones/entities/publicacion.entity.js';
import { Comentario } from './publicaciones/entities/comentario.entity.js';

dns.setServers(['8.8.8.8', '8.8.4.4']);

const CUENTAS: {
  perfil: Perfil;
  clave: string;
  correo: string;
  nombreUsuario: string;
  nombre: string;
}[] = [
  { perfil: 'usuario', clave: 'USUARIO', correo: 'usuario@trochita.com', nombreUsuario: 'maquinista', nombre: 'Usuario' },
  { perfil: 'administrador', clave: 'ADMIN', correo: 'admin@trochita.com', nombreUsuario: 'jefe_de_estacion', nombre: 'Administrador' },
];

// Publicaciones de ejemplo: autor (0 = usuario, 1 = administrador), quiénes dieron me gusta y comentarios
const PUBLICACIONES = [
  { autor: 0, titulo: 'Mi primer diorama en escala N', descripcion: 'Una estación chica con andén, farol y un par de vagones de carga. Tardé tres fines de semana.', meGusta: [1], comentarios: [[1, '¡Quedó hermoso! ¿Qué pasto usaste?'], [0, 'Fibras de pasto estático, las compré en una casa de modelismo.']] },
  { autor: 1, titulo: 'La Trochita en escala HO', descripcion: 'Terminé la locomotora a vapor de trocha angosta. Falta envejecer la pintura.', meGusta: [0], comentarios: [[0, 'Es una belleza, el negro mate le queda perfecto.']] },
  { autor: 0, titulo: 'Cómo armo mis vías', descripcion: 'Les dejo mi método para que las curvas queden suaves y sin saltos en las uniones.', meGusta: [], comentarios: [] },
  { autor: 1, titulo: 'Puente de madera hecho a mano', descripcion: 'Palitos de helado, cola vinílica y mucha paciencia.', meGusta: [0, 1], comentarios: [[0, 'Muy buena idea, lo voy a copiar.'], [1, '¡Dale! Subí fotos cuando lo termines.']] },
  { autor: 0, titulo: '¿Qué controlador digital me recomiendan?', descripcion: 'Estoy pasando mi maqueta de analógico a DCC y no sé por dónde empezar.', meGusta: [], comentarios: [[1, 'Empezá con uno básico, después escalás.']] },
  { autor: 1, titulo: 'Visita al museo ferroviario', descripcion: 'Vi locomotoras reales de todas las épocas. Se los recomiendo si pasan por la zona.', meGusta: [0], comentarios: [] },
];

// Crea (si no existen) las cuentas de los botones de acceso rápido y publicaciones de ejemplo.
// Se puede correr las veces que haga falta.
async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });
  const config = app.get(ConfigService);
  const usuarios = app.get(UsuariosService);
  const imagenPerfil = config.get<string>('IMAGEN_PERFIL_DEFECTO', '');

  const ids: Types.ObjectId[] = [];
  for (const cuenta of CUENTAS) {
    const correo = config.get<string>(`SEED_${cuenta.clave}_CORREO`, cuenta.correo);
    const contrasena = config.get<string>(`SEED_${cuenta.clave}_CONTRASENA`, 'Trochita123');
    let usuario = await usuarios.buscarParaLogin(correo);
    if (usuario) {
      console.log(`Ya existe: ${correo}`);
    } else {
      usuario = await usuarios.crear(
        {
          nombre: cuenta.nombre,
          apellido: 'La Trochita',
          correo,
          nombreUsuario: cuenta.nombreUsuario,
          contrasena,
          fechaNacimiento: '2000-01-01',
          descripcion: `Cuenta de ${cuenta.perfil} para pruebas`,
          imagenPerfil,
        },
        cuenta.perfil,
      );
      console.log(`Creado: ${correo} (${cuenta.perfil})`);
    }
    ids.push(usuario._id);
  }

  const publicaciones = app.get<Model<Publicacion>>(getModelToken(Publicacion.name));
  const comentarios = app.get<Model<Comentario>>(getModelToken(Comentario.name));
  if (await publicaciones.exists({})) {
    console.log('Ya hay publicaciones: no se agregan las de ejemplo');
  } else {
    const hora = 60 * 60 * 1000;
    for (const [i, p] of PUBLICACIONES.entries()) {
      // Fechas escalonadas (la primera es la más vieja) para que el orden se note
      const fecha = new Date(Date.now() - (PUBLICACIONES.length - i) * 5 * hora);
      const datos: Partial<Publicacion> & { createdAt: Date } = {
        titulo: p.titulo,
        descripcion: p.descripcion,
        autor: ids[p.autor],
        meGusta: p.meGusta.map((n) => ids[n]),
        cantidadMeGusta: p.meGusta.length,
        createdAt: fecha,
      };
      const creada = await publicaciones.create(datos);
      for (const [j, [autor, mensaje]] of p.comentarios.entries()) {
        const datosComentario: Partial<Comentario> & { createdAt: Date } = {
          publicacion: creada._id,
          autor: ids[autor as number],
          mensaje: mensaje as string,
          createdAt: new Date(fecha.getTime() + (j + 1) * hora),
        };
        await comentarios.create(datosComentario);
      }
    }
    console.log(`Creadas ${PUBLICACIONES.length} publicaciones de ejemplo`);
  }
  await app.close();
}
await seed();

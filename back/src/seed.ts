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
  descripcion: string;
  deshabilitada?: boolean;
}[] = [
  { perfil: 'usuario', clave: 'USUARIO', correo: 'usuario@trochita.com', nombreUsuario: 'maquinista', descripcion: 'Armo dioramas en escala N y colecciono locomotoras a vapor.', nombre: 'Usuario' },
  { perfil: 'administrador', clave: 'ADMIN', correo: 'admin@trochita.com', nombreUsuario: 'jefe_de_estacion', descripcion: 'Administro la comunidad de La Trochita.', nombre: 'Administrador' },
  // Para mostrar el aviso de cuenta deshabilitada con el tercer botón de acceso rápido (D10.9)
  { perfil: 'usuario', clave: 'DESHABILITADO', correo: 'deshabilitado@trochita.com', nombreUsuario: 'sin_boleto', descripcion: 'Cuenta deshabilitada, para probar el aviso de baja.', nombre: 'Deshabilitado', deshabilitada: true },
  { perfil: 'usuario', clave: 'LUCIA', correo: 'lucia@trochita.com', nombreUsuario: 'lucia_vapor', descripcion: 'Locomotoras a vapor, iluminación LED y electrónica.', nombre: 'Lucía' },
  { perfil: 'usuario', clave: 'MARTIN', correo: 'martin@trochita.com', nombreUsuario: 'martin_riel', descripcion: 'Trenes de carga y locomotoras diésel en escala N.', nombre: 'Martín' },
  { perfil: 'usuario', clave: 'SOFIA', correo: 'sofia@trochita.com', nombreUsuario: 'sofi_maquetas', descripcion: 'Paisajes, nieve y maquetas grandes de club.', nombre: 'Sofía' },
];

// Publicaciones de ejemplo: autor (índice en CUENTAS: 0 usuario, 1 administrador, 3 Lucía, 4 Martín, 5 Sofía),
// quiénes dieron me gusta (índices de CUENTAS) y comentarios [autor, mensaje]
const PUBLICACIONES = [
  { autor: 0, titulo: 'Mi primer diorama en escala N', descripcion: 'Una estación chica con andén, farol y un par de vagones de carga. Tardé tres fines de semana.', meGusta: [1], comentarios: [[1, '¡Quedó hermoso! ¿Qué pasto usaste?'], [0, 'Fibras de pasto estático, las compré en una casa de modelismo.']] },
  { autor: 1, titulo: 'La Trochita en escala HO', descripcion: 'Terminé la locomotora a vapor de trocha angosta. Falta envejecer la pintura.', meGusta: [0], comentarios: [[0, 'Es una belleza, el negro mate le queda perfecto.']] },
  { autor: 0, titulo: 'Cómo armo mis vías', descripcion: 'Les dejo mi método para que las curvas queden suaves y sin saltos en las uniones.', meGusta: [], comentarios: [] },
  { autor: 1, titulo: 'Puente de madera hecho a mano', descripcion: 'Palitos de helado, cola vinílica y mucha paciencia.', meGusta: [0, 1], comentarios: [[0, 'Muy buena idea, lo voy a copiar.'], [1, '¡Dale! Subí fotos cuando lo termines.']] },
  { autor: 0, titulo: '¿Qué controlador digital me recomiendan?', descripcion: 'Estoy pasando mi maqueta de analógico a DCC y no sé por dónde empezar.', meGusta: [], comentarios: [[1, 'Empezá con uno básico, después escalás.']] },
  { autor: 1, titulo: 'Visita al museo ferroviario', descripcion: 'Vi locomotoras reales de todas las épocas. Se los recomiendo si pasan por la zona.', meGusta: [0], comentarios: [] },
  { autor: 3, titulo: 'Túnel de montaña con luces LED', descripcion: 'Armé el túnel con espuma y yeso, y le puse tiras LED para iluminar el interior cuando pasa el tren.', meGusta: [0, 1, 4, 5], comentarios: [[4, '¡Qué efecto! ¿Cómo lo conectaste a la fuente?'], [3, 'Con un transformador de 12V y un interruptor oculto.'], [1, 'Excelente acabado.']] },
  { autor: 4, titulo: 'Locomotora diésel en escala N', descripcion: 'Le cambié el motor y ahora arranca mucho más suave. Dejo fotos del antes y el después.', meGusta: [3], comentarios: [[3, '¿Cuánto te costó el motor nuevo?'], [4, 'Unos 25 dólares, vale la pena.']] },
  { autor: 5, titulo: 'Paisaje nevado paso a paso', descripcion: 'Uso bicarbonato, cola blanca y un poco de brillo para lograr el efecto de nieve fresca.', meGusta: [0, 1, 3, 4], comentarios: [[0, 'Me encantó, lo voy a probar en mi próximo diorama.'], [3, 'El brillo le da un toque muy realista.'], [5, 'Gracias, ¡cualquier duda pregunten!']] },
  { autor: 3, titulo: 'Señales ferroviarias con Arduino', descripcion: 'Programé semáforos que cambian de color según la posición del tren usando sensores infrarrojos.', meGusta: [4, 5], comentarios: [[5, '¿Podés compartir el código?'], [3, 'Claro, lo subo a un repositorio esta semana.']] },
  { autor: 4, titulo: 'Taller de envejecido de vagones', descripcion: 'Con pinturas acrílicas y pigmentos logré el óxido y el polvo de un vagón que lleva décadas en servicio.', meGusta: [1], comentarios: [] },
  { autor: 5, titulo: 'Mi maqueta completa después de dos años', descripcion: 'Mil quinientos centímetros de vías, tres estaciones y un pueblo entero. Gracias a todos por los consejos.', meGusta: [0, 1, 3, 4], comentarios: [[1, '¡Impresionante trabajo!'], [0, 'Es de las mejores que vi por acá.'], [4, 'Quiero ver el pueblo de cerca.'], [3, 'Felicitaciones, se nota la dedicación.']] },
  { autor: 3, titulo: 'Estación terminal con andenes curvos', imagen: 'https://picsum.photos/seed/terminal/800/600', descripcion: 'Diseñé una terminal de cuatro vías con andenes curvos y una marquesina de chapa. Todavía falta la cartelería.', meGusta: [0, 4], comentarios: [[4, 'La marquesina quedó muy realista.'], [3, 'Gracias, la hice con plástico de blíster.']] },
  { autor: 4, titulo: 'Mi tren de carga recorriendo el valle', imagen: 'https://picsum.photos/seed/carga/800/600', descripcion: 'Doce vagones tolva tirados por dos locomotoras. Lo grabé en video y subo las mejores tomas esta semana.', meGusta: [1, 3, 5], comentarios: [[5, '¡Qué largo! ¿Entra en la curva sin descarrilar?'], [4, 'Sí, con radio mínimo de 40 cm.']] },
  { autor: 5, titulo: 'Taller de locomotoras en miniatura', imagen: 'https://picsum.photos/seed/taller/800/600', descripcion: 'Armé un galpón con mesa de trabajo, herramientas diminutas y una locomotora desarmada para darle vida al escenario.', meGusta: [0, 1], comentarios: [[1, 'Los detalles son increíbles.']] },
  { autor: 3, titulo: 'Guía completa: cómo armo una montaña', imagen: 'https://picsum.photos/seed/montana/800/600', descripcion: 'Después de meses de prueba y error, este es el proceso que sigo para armar una montaña. Primero armo la estructura con cartón corrugado y la cubro con tiras de yeso. Una vez seca, la pinto con una base marrón oscuro y la aclaro con pincel seco. Para la vegetación uso fibras, esponja teñida y flocado en tres tonos de verde. Por último agrego el agua con resina epoxi en capas finas. Todo el proceso me lleva unas tres semanas, trabajando de a ratos.', meGusta: [0, 1, 4], comentarios: [[0, 'Súper detallado, gracias por compartirlo.'], [4, '¿Qué resina usás para el agua?'], [3, 'Una epoxi de dos componentes, de curado lento.']] },
  { autor: 4, titulo: 'Pueblo nocturno con iluminación', imagen: 'https://picsum.photos/seed/pueblo/800/600', descripcion: 'Cada casita tiene su propia luz cálida. De noche, con el tren pasando, parece una postal.', meGusta: [0, 3, 5], comentarios: [[3, '¡Una belleza! ¿Qué LEDs usaste?'], [4, 'Warm white de 3 mm con resistencias de 1k.']] },
  { autor: 5, titulo: 'Cruce a nivel con barreras automáticas', imagen: 'https://picsum.photos/seed/cruce/800/600', descripcion: 'Las barreras bajan solas cuando se acerca el tren gracias a un sensor magnético escondido en la vía.', meGusta: [1, 4], comentarios: [] },
  { autor: 4, titulo: 'Locomotora eléctrica italiana en HO', imagen: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/6/6d/Kleinbahn_H0_scale_model_railway_FS_Locomotive_E_424.jpg/960px-Kleinbahn_H0_scale_model_railway_FS_Locomotive_E_424.jpg', descripcion: 'Mi nueva E 424 de Kleinbahn en escala HO. Tiene luces que cambian con el sentido de marcha y un andar muy suave.', meGusta: [0, 3, 5], comentarios: [[5, '¡Qué detalle en la pintura!'], [4, 'Gracias, la compré usada y la reacondicioné.']] },
  { autor: 3, titulo: 'Locomotora ÖBB en la maqueta del club', imagen: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/3/3e/Kleinbahn_H0_scale_model_railway_%C3%96BB_electric_locomotive_1280.jpg/960px-Kleinbahn_H0_scale_model_railway_%C3%96BB_electric_locomotive_1280.jpg', descripcion: 'Una eléctrica austríaca que corre en la maqueta del club los sábados. Me encanta cómo se ve en los tramos rectos.', meGusta: [1, 4], comentarios: [[1, 'Muy elegante.']] },
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
          descripcion: cuenta.descripcion,
          imagenPerfil,
        },
        cuenta.perfil,
      );
      console.log(`Creado: ${correo} (${cuenta.perfil})`);
    }
    if (cuenta.deshabilitada && usuario.activo) {
      usuario.activo = false;
      await usuario.save();
      console.log(`Deshabilitado: ${correo}`);
    }
    ids.push(usuario._id);
  }

  const publicaciones = app.get<Model<Publicacion>>(getModelToken(Publicacion.name));
  const comentarios = app.get<Model<Comentario>>(getModelToken(Comentario.name));
  {
    const hora = 60 * 60 * 1000;
    let creadas = 0;
    for (const [i, p] of PUBLICACIONES.entries()) {
      // Se saltea las que ya existen (mismo título) para poder correr el seed varias veces
      if (await publicaciones.exists({ titulo: p.titulo })) continue;
      creadas++;
      // Fechas escalonadas (la primera es la más vieja) para que el orden se note
      const fecha = new Date(Date.now() - (PUBLICACIONES.length - i) * 5 * hora);
      const datos: Partial<Publicacion> & { createdAt: Date } = {
        titulo: p.titulo,
        descripcion: p.descripcion,
        imagen: p.imagen ?? '',
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
    console.log(`Creadas ${creadas} publicaciones de ejemplo (el resto ya existía)`);
  }
  await app.close();
}
await seed();

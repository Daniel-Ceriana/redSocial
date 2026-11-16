import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ArchivosService } from '../common/archivos.service.js';
import { ComentariosController } from './comentarios.controller.js';
import { ComentariosService } from './comentarios.service.js';
import { Usuario, UsuarioSchema } from '../usuarios/entities/usuario.entity.js';
import { EstadisticasController } from './estadisticas.controller.js';
import { EstadisticasService } from './estadisticas.service.js';
import { Comentario, ComentarioSchema } from './entities/comentario.entity.js';
import { Publicacion, PublicacionSchema } from './entities/publicacion.entity.js';
import { PublicacionesController } from './publicaciones.controller.js';
import { PublicacionesService } from './publicaciones.service.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Publicacion.name, schema: PublicacionSchema },
      { name: Comentario.name, schema: ComentarioSchema },
      // Solo lectura: las estadísticas muestran el nombre de usuario de cada autor
      { name: Usuario.name, schema: UsuarioSchema },
    ]),
  ],
  controllers: [PublicacionesController, ComentariosController, EstadisticasController],
  providers: [PublicacionesService, ComentariosService, EstadisticasService, ArchivosService],
  // Usuarios lo usa para ocultar y restaurar las publicaciones de un usuario deshabilitado
  exports: [PublicacionesService],
})
export class PublicacionesModule {}

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ArchivosService } from '../common/archivos.service.js';
import { ComentariosController } from './comentarios.controller.js';
import { ComentariosService } from './comentarios.service.js';
import { Comentario, ComentarioSchema } from './entities/comentario.entity.js';
import { Publicacion, PublicacionSchema } from './entities/publicacion.entity.js';
import { PublicacionesController } from './publicaciones.controller.js';
import { PublicacionesService } from './publicaciones.service.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Publicacion.name, schema: PublicacionSchema },
      { name: Comentario.name, schema: ComentarioSchema },
    ]),
  ],
  controllers: [PublicacionesController, ComentariosController],
  providers: [PublicacionesService, ComentariosService, ArchivosService],
})
export class PublicacionesModule {}

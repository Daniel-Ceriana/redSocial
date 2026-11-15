import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ArchivosService } from '../common/archivos.service.js';
import { PublicacionesModule } from '../publicaciones/publicaciones.module.js';
import { Usuario, UsuarioSchema } from './entities/usuario.entity.js';
import { UsuariosController } from './usuarios.controller.js';
import { UsuariosService } from './usuarios.service.js';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Usuario.name, schema: UsuarioSchema }]),
    PublicacionesModule,
  ],
  controllers: [UsuariosController],
  providers: [UsuariosService, ArchivosService],
  exports: [UsuariosService],
})
export class UsuariosModule {}

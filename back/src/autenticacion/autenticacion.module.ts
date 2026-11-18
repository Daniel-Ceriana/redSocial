import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Usuario, UsuarioSchema } from '../usuarios/entities/usuario.entity.js';
import { UsuariosModule } from '../usuarios/usuarios.module.js';
import { AutenticacionController } from './autenticacion.controller.js';
import { ArchivosService } from '../common/archivos.service.js';
import { AutenticacionService } from './autenticacion.service.js';

@Module({
  // El modelo de usuario lo necesita el AuthGuard (comprueba que la cuenta siga habilitada)
  imports: [UsuariosModule, MongooseModule.forFeature([{ name: Usuario.name, schema: UsuarioSchema }])],
  controllers: [AutenticacionController],
  providers: [AutenticacionService, ArchivosService],
})
export class AutenticacionModule {}

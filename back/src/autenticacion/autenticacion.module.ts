import { Module } from '@nestjs/common';
import { UsuariosModule } from '../usuarios/usuarios.module.js';
import { AutenticacionController } from './autenticacion.controller.js';
import { ArchivosService } from '../common/archivos.service.js';
import { AutenticacionService } from './autenticacion.service.js';

@Module({
  imports: [UsuariosModule],
  controllers: [AutenticacionController],
  providers: [AutenticacionService, ArchivosService],
})
export class AutenticacionModule {}

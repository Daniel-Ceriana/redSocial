import {
  Body,
  Controller,
  HttpCode,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { crearPipeImagen } from '../common/imagen.pipe.js';
import { AutenticacionService } from './autenticacion.service.js';
import { LoginDto } from './dto/login.dto.js';
import { RegistroDto } from './dto/registro.dto.js';

@Controller('autenticacion')
export class AutenticacionController {
  constructor(private readonly autenticacionService: AutenticacionService) {}

  // multipart/form-data: los campos del DTO + "imagen" (opcional)
  @Post('registro')
  @UseInterceptors(FileInterceptor('imagen', { storage: memoryStorage() }))
  registro(
    @Body() dto: RegistroDto,
    @UploadedFile(crearPipeImagen()) imagen?: Express.Multer.File,
  ) {
    return this.autenticacionService.registro(dto, imagen);
  }

  @Post('login')
  @HttpCode(200)
  login(@Body() dto: LoginDto) {
    return this.autenticacionService.login(dto);
  }
}

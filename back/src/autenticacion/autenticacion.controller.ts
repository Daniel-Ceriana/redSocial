import {
  Body,
  Controller,
  HttpCode,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { crearPipeImagen } from '../common/imagen.pipe.js';
import { AutenticacionService } from './autenticacion.service.js';
import { AuthGuard, PayloadToken } from './guards/auth.guard.js';
import { LoginDto } from './dto/login.dto.js';
import { RegistroDto } from './dto/registro.dto.js';

@Controller('autenticacion')
export class AutenticacionController {
  constructor(private readonly autenticacionService: AutenticacionService) {}

  // multipart/form-data: los campos del DTO + "imagen" (opcional)
  // 5 registros por minuto y por IP
  @Post('registro')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @UseInterceptors(FileInterceptor('imagen', { storage: memoryStorage() }))
  registro(
    @Body() dto: RegistroDto,
    @UploadedFile(crearPipeImagen()) imagen?: Express.Multer.File,
  ) {
    return this.autenticacionService.registro(dto, imagen);
  }

  // 5 intentos por minuto y por IP: frena la fuerza bruta de contraseñas (429 al pasarse)
  @Post('login')
  @HttpCode(200)
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  login(@Body() dto: LoginDto) {
    return this.autenticacionService.login(dto);
  }

  // Header "Authorization: Bearer <token>": 401 si no es válido o venció; si sirve, los datos del usuario (3.B6)
  @Post('autorizar')
  @HttpCode(200)
  @UseGuards(AuthGuard)
  autorizar(@Req() req: { usuario: PayloadToken }) {
    return this.autenticacionService.autorizar(req.usuario);
  }

  // Header "Authorization: Bearer <token>" con un token todavía válido; devuelve uno nuevo (3.B7)
  @Post('refrescar')
  @HttpCode(200)
  @UseGuards(AuthGuard)
  refrescar(@Req() req: { usuario: PayloadToken }) {
    return this.autenticacionService.refrescar(req.usuario.sub);
  }
}

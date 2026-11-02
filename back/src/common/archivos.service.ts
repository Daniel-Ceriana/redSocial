import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';

@Injectable()
export class ArchivosService {
  private readonly logger = new Logger(ArchivosService.name);

  constructor(config: ConfigService) {
    cloudinary.config({
      cloud_name: config.get<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: config.get<string>('CLOUDINARY_API_KEY'),
      api_secret: config.get<string>('CLOUDINARY_API_SECRET'),
    });
  }

  // Sube la imagen a una carpeta de Cloudinary y devuelve su URL (secure_url)
  subirImagen(archivo: Express.Multer.File, carpeta: string): Promise<string> {
    return new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          { folder: `trochita/${carpeta}`, resource_type: 'image' },
          (error, resultado) => {
            if (error || !resultado) {
              this.logger.error(`Cloudinary: ${error?.message ?? 'sin resultado'}`);
              return reject(
                new InternalServerErrorException('No se pudo subir la imagen'),
              );
            }
            resolve(resultado.secure_url);
          },
        )
        .end(archivo.buffer);
    });
  }
}

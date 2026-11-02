import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

// Los ids de Mongo son 24 caracteres hexadecimales; cualquier otra cosa es un 400
@Injectable()
export class ParseObjectIdPipe implements PipeTransform<string, string> {
  transform(valor: string): string {
    if (!/^[0-9a-fA-F]{24}$/.test(valor)) {
      throw new BadRequestException('El id no tiene un formato válido');
    }
    return valor;
  }
}

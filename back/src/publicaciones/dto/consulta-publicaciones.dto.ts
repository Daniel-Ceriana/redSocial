import { Transform } from 'class-transformer';
import { IsBoolean, IsIn, IsMongoId, IsOptional } from 'class-validator';
import { PaginacionDto } from '../../common/paginacion.dto.js';

export class ConsultaPublicacionesDto extends PaginacionDto {
  @IsOptional()
  @IsIn(['fecha', 'meGusta'], { message: 'orden debe ser "fecha" o "meGusta"' })
  orden: 'fecha' | 'meGusta' = 'fecha';

  @IsOptional()
  @IsMongoId({ message: 'usuario debe ser un id válido' })
  usuario?: string;

  // Solo administradores y junto con "usuario": incluye las dadas de baja (S11). En la URL llega como texto.
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    value === 'true' ? true : value === 'false' ? false : value,
  )
  @IsBoolean({ message: 'incluirBajas debe ser true o false' })
  incluirBajas?: boolean;
}

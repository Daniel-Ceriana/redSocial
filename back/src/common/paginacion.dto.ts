import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export const LIMITE_POR_DEFECTO = 5;
export const LIMITE_MAXIMO = 20;

export class PaginacionDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'offset debe ser un número entero' })
  @Min(0, { message: 'offset no puede ser negativo' })
  offset: number = 0;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'limit debe ser un número entero' })
  @Min(1, { message: 'limit debe ser al menos 1' })
  @Max(LIMITE_MAXIMO, { message: `limit puede ser como máximo ${LIMITE_MAXIMO}` })
  limit: number = LIMITE_POR_DEFECTO;
}

// Forma de las respuestas de los listados
export interface Pagina<T> {
  datos: T[];
  total: number;
  offset: number;
  limit: number;
}

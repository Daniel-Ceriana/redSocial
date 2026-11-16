import { Transform } from 'class-transformer';
import { IsBoolean, IsIn, IsISO8601, IsNotEmpty, IsOptional, Matches } from 'class-validator';

// Lapso más largo que se puede consultar (el gráfico por día tendría demasiados puntos)
export const DIAS_MAXIMOS_LAPSO = 366;

export const ESTADOS_ESTADISTICAS = ['activas', 'inactivas', 'todas'] as const;
export type EstadoEstadisticas = (typeof ESTADOS_ESTADISTICAS)[number];

// Query de los tres GET de estadísticas (D12.3, D12.4). Las fechas son días en hora argentina: AAAA-MM-DD.
export class ConsultaEstadisticasDto {
  @IsNotEmpty({ message: 'desde es obligatorio' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'desde debe tener el formato AAAA-MM-DD' })
  @IsISO8601({ strict: true }, { message: 'desde debe ser una fecha válida' })
  desde: string;

  @IsNotEmpty({ message: 'hasta es obligatorio' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'hasta debe tener el formato AAAA-MM-DD' })
  @IsISO8601({ strict: true }, { message: 'hasta debe ser una fecha válida' })
  hasta: string;

  @IsOptional()
  @IsIn(ESTADOS_ESTADISTICAS, { message: 'estado debe ser "activas", "inactivas" o "todas"' })
  estado: EstadoEstadisticas = 'activas';
}

export const CANTIDADES_RANKING = ['5', '10', '15', 'todos'] as const;
export type CantidadRanking = (typeof CANTIDADES_RANKING)[number];
export const ORDENES_RANKING = ['mayor', 'menor'] as const;
export type OrdenRanking = (typeof ORDENES_RANKING)[number];

// Query de los gráficos que son un ranking (publicaciones por usuario, comentarios por publicación, D12.7):
// cuántos se muestran y si son los que tienen más o los que tienen menos
export class ConsultaRankingDto extends ConsultaEstadisticasDto {
  @IsOptional()
  @IsIn(CANTIDADES_RANKING, { message: 'cantidad debe ser "5", "10", "15" o "todos"' })
  cantidad: CantidadRanking = '10';

  @IsOptional()
  @IsIn(ORDENES_RANKING, { message: 'orden debe ser "mayor" o "menor"' })
  orden: OrdenRanking = 'mayor';
}

// Comentarios por publicación: además, si se listan las publicaciones sin comentarios en el lapso (D12.8).
// En la URL llega como texto.
export class ConsultaComentariosPublicacionDto extends ConsultaRankingDto {
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    value === 'true' ? true : value === 'false' ? false : value,
  )
  @IsBoolean({ message: 'incluirSinComentarios debe ser true o false' })
  incluirSinComentarios: boolean = false;
}

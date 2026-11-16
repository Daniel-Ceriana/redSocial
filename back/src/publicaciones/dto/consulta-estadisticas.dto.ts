import { IsIn, IsISO8601, IsNotEmpty, IsOptional, Matches } from 'class-validator';

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

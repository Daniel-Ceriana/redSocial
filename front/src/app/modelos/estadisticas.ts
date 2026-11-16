// Respuestas de /api/estadisticas (4.B6), una por gráfico

export type EstadoEstadisticas = 'activas' | 'inactivas' | 'todas';

export interface Lapso {
  desde: string; // AAAA-MM-DD
  hasta: string; // AAAA-MM-DD
  estado: EstadoEstadisticas;
}

// Los gráficos de ranking muestran los N usuarios o publicaciones con más o con menos (D12.7)
export type CantidadRanking = '5' | '10' | '15' | 'todos';
export type OrdenRanking = 'mayor' | 'menor';

export interface OpcionesRanking {
  cantidad: CantidadRanking;
  orden: OrdenRanking;
}

export interface PublicacionesDeUsuario {
  usuarioId: string;
  usuario: string; // nombre de usuario
  cantidad: number;
}

export interface ComentariosDeUnDia {
  fecha: string; // AAAA-MM-DD
  cantidad: number;
}

export interface ComentariosDePublicacion {
  publicacionId: string;
  titulo: string;
  cantidad: number;
}

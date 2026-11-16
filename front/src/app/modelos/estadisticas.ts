// Respuestas de /api/estadisticas (4.B6), una por gráfico

export type EstadoEstadisticas = 'activas' | 'inactivas' | 'todas';

export interface Lapso {
  desde: string; // AAAA-MM-DD
  hasta: string; // AAAA-MM-DD
  estado: EstadoEstadisticas;
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

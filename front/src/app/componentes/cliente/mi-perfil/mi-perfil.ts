import { Component, inject, OnInit, signal } from '@angular/core';
import { ComentarioPublicacion } from '../../../modelos/comentario';
import { Publicacion } from '../../../modelos/publicacion';
import { Auth } from '../../../services/auth';
import { PublicacionesApi } from '../../../services/publicaciones-api';
import { formatearFecha } from '../../../utilidades/fechas';
import { Avatar } from '../../compartido/avatar/avatar';
import { Comentario } from '../../compartido/comentario/comentario';
import { EditarPerfil } from '../editar-perfil/editar-perfil';
import { TarjetaPublicacion } from '../tarjeta-publicacion/tarjeta-publicacion';

const CANTIDAD_PUBLICACIONES = 3;
const CANTIDAD_COMENTARIOS = 3;

interface PublicacionConComentarios {
  publicacion: Publicacion;
  comentarios: ComentarioPublicacion[];
  totalComentarios: number;
}

@Component({
  imports: [Avatar, Comentario, EditarPerfil, TarjetaPublicacion],
  selector: 'app-mi-perfil',
  templateUrl: './mi-perfil.html',
  styleUrl: './mi-perfil.css',
})
export class MiPerfil implements OnInit {
  private auth = inject(Auth);
  private api = inject(PublicacionesApi);

  protected usuario = this.auth.usuario;
  protected formatearFecha = formatearFecha;

  protected editando = signal(false);
  protected aviso = signal('');

  protected items = signal<PublicacionConComentarios[]>([]);
  protected estado = signal<'cargando' | 'listo' | 'error'>('cargando');
  protected cantidadComentarios = CANTIDAD_COMENTARIOS;

  private temporizadorAviso?: ReturnType<typeof setTimeout>;

  ngOnInit() {
    // Muestra lo que ya hay y lo actualiza con los datos del back
    this.auth.refrescarUsuario().catch(() => {
      // si falla, se queda con los datos de la sesión
    });
    void this.cargarPublicaciones();
  }

  // Mis últimas publicaciones, cada una con sus comentarios más recientes
  protected async cargarPublicaciones() {
    const usuario = this.usuario();
    if (!usuario) return;
    this.estado.set('cargando');
    try {
      const pagina = await this.api.listar('fecha', 1, {
        usuarioId: usuario.id,
        limite: CANTIDAD_PUBLICACIONES,
      });
      this.items.set(
        await Promise.all(
          pagina.datos.map(async (publicacion) => {
            const comentarios = await this.api.comentarios(publicacion.id, CANTIDAD_COMENTARIOS);
            return {
              publicacion,
              comentarios: comentarios.datos,
              totalComentarios: comentarios.total,
            };
          }),
        ),
      );
      this.estado.set('listo');
    } catch {
      this.estado.set('error');
    }
  }

  protected reemplazar(actualizada: Publicacion) {
    this.items.update((lista) =>
      lista.map((i) => (i.publicacion.id === actualizada.id ? { ...i, publicacion: actualizada } : i)),
    );
  }

  protected alGuardar() {
    this.editando.set(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    clearTimeout(this.temporizadorAviso);
    this.aviso.set('Perfil actualizado');
    this.temporizadorAviso = setTimeout(() => this.aviso.set(''), 4000);
  }
}

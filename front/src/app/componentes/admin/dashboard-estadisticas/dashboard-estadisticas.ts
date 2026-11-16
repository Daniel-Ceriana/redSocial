import { Component, computed, inject, OnInit, signal, WritableSignal } from '@angular/core';
import { form, FormField, required, validate } from '@angular/forms/signals';
import { ChartConfiguration } from 'chart.js';
import {
  ComentariosDePublicacion,
  ComentariosDeUnDia,
  CantidadRanking,
  EstadoEstadisticas,
  Lapso,
  OrdenRanking,
  PublicacionesDeUsuario,
} from '../../../modelos/estadisticas';
import { EstadisticasApi } from '../../../services/estadisticas-api';
import { diasEntre, fechaHaceDias, hoyEnArgentina } from '../../../utilidades/fechas';
import { Cargando } from '../../compartido/cargando/cargando';
import { Grafico } from '../../compartido/grafico/grafico';

// Mismo tope que el back (DIAS_MAXIMOS_LAPSO en consulta-estadisticas.dto.ts)
const DIAS_MAXIMOS_LAPSO = 366;
const DIAS_POR_DEFECTO = 30;

// Colores de la identidad visual (Chart.js dibuja en un canvas y no lee las variables CSS)
const COLORES = ['#1f4b3a', '#b8862b', '#8b6a48', '#6f8a4e', '#a63d2f', '#5b4a38', '#e6c77c', '#9a9188'];

type Carga<T> = { estado: 'cargando' } | { estado: 'error' } | { estado: 'listo'; datos: T };

// dashboard/estadisticas (4.F3, solo administradores): tres gráficos de tipos distintos (D12.5) con un solo
// lapso y un selector de estado de las publicaciones (D12.3, D12.4).
@Component({
  imports: [Cargando, FormField, Grafico],
  selector: 'app-dashboard-estadisticas',
  templateUrl: './dashboard-estadisticas.html',
  styleUrl: './dashboard-estadisticas.css',
})
export class DashboardEstadisticas implements OnInit {
  private api = inject(EstadisticasApi);

  protected hoy = hoyEnArgentina();
  protected estado = signal<EstadoEstadisticas>('activas');

  // Controles propios de cada ranking (D12.7, D12.8): cuántos se muestran y si son los de más o los de menos
  protected cantidadUsuarios = signal<CantidadRanking>('10');
  protected ordenUsuarios = signal<OrdenRanking>('mayor');
  protected cantidadPublicaciones = signal<CantidadRanking>('10');
  protected ordenPublicaciones = signal<OrdenRanking>('mayor');
  protected incluirSinComentarios = signal(false);

  protected model = signal({ desde: fechaHaceDias(DIAS_POR_DEFECTO - 1), hasta: hoyEnArgentina() });
  // Mismas reglas que ConsultaEstadisticasDto y EstadisticasService del back (G9)
  protected filtroForm = form(this.model, (p) => {
    required(p.desde, { message: 'La fecha desde es obligatoria' });
    required(p.hasta, { message: 'La fecha hasta es obligatoria' });
    validate(p.hasta, ({ value, valueOf }) => {
      const desde = valueOf(p.desde);
      if (!value() || !desde) return null;
      if (desde > value()) {
        return { kind: 'orden', message: 'La fecha desde no puede ser posterior a la fecha hasta' };
      }
      if (diasEntre(desde, value()) > DIAS_MAXIMOS_LAPSO) {
        return { kind: 'largo', message: `El lapso puede ser de hasta ${DIAS_MAXIMOS_LAPSO} días` };
      }
      return null;
    });
  });

  protected porUsuario = signal<Carga<PublicacionesDeUsuario[]>>({ estado: 'cargando' });
  protected porDia = signal<Carga<ComentariosDeUnDia[]>>({ estado: 'cargando' });
  protected porPublicacion = signal<Carga<ComentariosDePublicacion[]>>({ estado: 'cargando' });

  // Para descartar la respuesta de una consulta vieja si se vuelve a pedir (una cuenta por gráfico)
  private consultas = { usuario: 0, dia: 0, publicacion: 0 };

  // Gráficos que se están volviendo a pedir: se dejan a la vista, atenuados, para que la página no salte
  protected recargando = signal({ usuario: false, dia: false, publicacion: false });

  protected graficoTorta = computed(() => {
    const c = this.porUsuario();
    if (c.estado !== 'listo' || c.datos.length === 0) return null;
    const config: ChartConfiguration = {
      type: 'pie',
      data: {
        labels: c.datos.map((d) => `@${d.usuario}`),
        datasets: [
          {
            data: c.datos.map((d) => d.cantidad),
            backgroundColor: c.datos.map((_, i) => COLORES[i % COLORES.length]),
          },
        ],
      },
      options: { plugins: { legend: { position: 'bottom' } } },
    };
    return config;
  });

  protected graficoLineas = computed(() => {
    const c = this.porDia();
    if (c.estado !== 'listo') return null;
    const config: ChartConfiguration = {
      type: 'line',
      data: {
        labels: c.datos.map((d) => this.etiquetaDia(d.fecha)),
        datasets: [
          {
            label: 'Comentarios',
            data: c.datos.map((d) => d.cantidad),
            borderColor: COLORES[0],
            backgroundColor: COLORES[1],
            tension: 0.25,
          },
        ],
      },
      options: {
        scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
        plugins: { legend: { display: false } },
      },
    };
    return config;
  });

  protected graficoBarras = computed(() => {
    const c = this.porPublicacion();
    if (c.estado !== 'listo' || c.datos.length === 0) return null;
    const config: ChartConfiguration = {
      type: 'bar',
      data: {
        labels: c.datos.map((d) => (d.titulo.length > 24 ? `${d.titulo.slice(0, 23)}…` : d.titulo)),
        datasets: [
          { label: 'Comentarios', data: c.datos.map((d) => d.cantidad), backgroundColor: COLORES[2] },
        ],
      },
      options: {
        scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
        plugins: { legend: { display: false } },
      },
    };
    return config;
  });

  // Total de comentarios del lapso, para el resumen y para saber si hay datos
  protected totalComentarios = computed(() => {
    const c = this.porDia();
    return c.estado === 'listo' ? c.datos.reduce((suma, d) => suma + d.cantidad, 0) : 0;
  });

  ngOnInit() {
    void this.cargar();
  }

  protected elegirEstado(estado: EstadoEstadisticas) {
    this.estado.set(estado);
    void this.cargar();
  }

  // Cambiar un control de un ranking vuelve a pedir solo ese gráfico
  protected cambiarUsuarios(cantidad: string, orden: string) {
    this.cantidadUsuarios.set(cantidad as CantidadRanking);
    this.ordenUsuarios.set(orden as OrdenRanking);
    void this.cargarUsuarios();
  }

  protected cambiarPublicaciones(cantidad: string, orden: string, incluirSin: boolean) {
    this.cantidadPublicaciones.set(cantidad as CantidadRanking);
    this.ordenPublicaciones.set(orden as OrdenRanking);
    this.incluirSinComentarios.set(incluirSin);
    void this.cargarPublicaciones();
  }

  protected ver(evento: Event) {
    evento.preventDefault();
    this.filtroForm.desde().markAsTouched();
    this.filtroForm.hasta().markAsTouched();
    void this.cargar();
  }

  protected reintentar() {
    void this.cargar();
  }

  // Pide los tres gráficos juntos; cada uno muestra su propio error si falla
  private async cargar() {
    if (this.filtroForm().invalid()) return;
    await Promise.all([this.cargarUsuarios(), this.cargarDia(), this.cargarPublicaciones()]);
  }

  private lapso(): Lapso {
    return { ...this.model(), estado: this.estado() };
  }

  private cargarUsuarios() {
    if (this.filtroForm().invalid()) return;
    const ranking = { cantidad: this.cantidadUsuarios(), orden: this.ordenUsuarios() };
    return this.pedir('usuario', this.api.publicacionesPorUsuario(this.lapso(), ranking), this.porUsuario);
  }

  private cargarDia() {
    return this.pedir('dia', this.api.comentariosPorDia(this.lapso()), this.porDia);
  }

  private cargarPublicaciones() {
    if (this.filtroForm().invalid()) return;
    const ranking = { cantidad: this.cantidadPublicaciones(), orden: this.ordenPublicaciones() };
    return this.pedir(
      'publicacion',
      this.api.comentariosPorPublicacion(this.lapso(), ranking, this.incluirSinComentarios()),
      this.porPublicacion,
    );
  }

  // Muestra "cargando", espera la respuesta y la guarda; descarta la que llega después de una consulta más nueva
  private async pedir<T>(grafico: 'usuario' | 'dia' | 'publicacion', llamada: Promise<T>, destino: WritableSignal<Carga<T>>) {
    const numero = ++this.consultas[grafico];
    if (destino().estado === 'listo') {
      // Ya hay un gráfico: se queda donde está (con su alto) hasta que llegue el nuevo
      this.recargando.update((r) => ({ ...r, [grafico]: true }));
    } else {
      destino.set({ estado: 'cargando' });
    }
    let resultado: Carga<T>;
    try {
      resultado = { estado: 'listo', datos: await llamada };
    } catch {
      resultado = { estado: 'error' };
    }
    if (numero !== this.consultas[grafico]) return;
    destino.set(resultado);
    this.recargando.update((r) => ({ ...r, [grafico]: false }));
  }

  // "2026-11-14" -> "14/11"
  private etiquetaDia(fecha: string) {
    const [, mes, dia] = fecha.split('-');
    return `${dia}/${mes}`;
  }
}

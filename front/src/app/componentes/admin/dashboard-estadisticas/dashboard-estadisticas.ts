import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { form, FormField, required, validate } from '@angular/forms/signals';
import { ChartConfiguration } from 'chart.js';
import {
  ComentariosDePublicacion,
  ComentariosDeUnDia,
  EstadoEstadisticas,
  Lapso,
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

  // Para descartar la respuesta de una consulta vieja si se vuelve a pedir
  private consulta = 0;

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
    const numero = ++this.consulta;
    const lapso: Lapso = { ...this.model(), estado: this.estado() };
    this.porUsuario.set({ estado: 'cargando' });
    this.porDia.set({ estado: 'cargando' });
    this.porPublicacion.set({ estado: 'cargando' });

    const pedir = async <T>(llamada: Promise<T>, destino: (c: Carga<T>) => void) => {
      let resultado: Carga<T>;
      try {
        resultado = { estado: 'listo', datos: await llamada };
      } catch {
        resultado = { estado: 'error' };
      }
      if (numero === this.consulta) destino(resultado);
    };
    await Promise.all([
      pedir(this.api.publicacionesPorUsuario(lapso), (c) => this.porUsuario.set(c)),
      pedir(this.api.comentariosPorDia(lapso), (c) => this.porDia.set(c)),
      pedir(this.api.comentariosPorPublicacion(lapso), (c) => this.porPublicacion.set(c)),
    ]);
  }

  // "2026-11-14" -> "14/11"
  private etiquetaDia(fecha: string) {
    const [, mes, dia] = fecha.split('-');
    return `${dia}/${mes}`;
  }
}

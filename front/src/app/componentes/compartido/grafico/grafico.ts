import { Component, effect, ElementRef, input, OnDestroy, viewChild } from '@angular/core';
import {
  ArcElement,
  BarController,
  BarElement,
  CategoryScale,
  Chart,
  ChartConfiguration,
  Legend,
  LineController,
  LineElement,
  LinearScale,
  PieController,
  PointElement,
  Tooltip,
} from 'chart.js';

// Solo se registra lo que se usa (torta, barras y líneas), así el bundle pesa menos
Chart.register(
  ArcElement,
  BarController,
  BarElement,
  CategoryScale,
  Legend,
  LineController,
  LineElement,
  LinearScale,
  PieController,
  PointElement,
  Tooltip,
);
Chart.defaults.font.family = "'Inter', system-ui, sans-serif";
Chart.defaults.color = '#2b2118';

// Un gráfico de Chart.js en un <canvas>. Recibe la configuración y la vuelve a dibujar si cambia (D12.1).
@Component({
  selector: 'app-grafico',
  template: `<canvas #lienzo role="img" [attr.aria-label]="descripcion()"></canvas>`,
  styles: `
    :host {
      display: block;
      position: relative;
      height: 300px;
    }
  `,
})
export class Grafico implements OnDestroy {
  config = input.required<ChartConfiguration>();
  descripcion = input('Gráfico');

  private lienzo = viewChild.required<ElementRef<HTMLCanvasElement>>('lienzo');
  private grafico?: Chart;

  constructor() {
    effect(() => {
      const config = this.config();
      this.grafico?.destroy();
      this.grafico = new Chart(this.lienzo().nativeElement, {
        ...config,
        options: { responsive: true, maintainAspectRatio: false, ...config.options },
      });
    });
  }

  ngOnDestroy() {
    this.grafico?.destroy();
  }
}

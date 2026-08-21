import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { ResumenFinanciero, ReportesService } from './reportes.service';

type Rango = 'hoy' | 'mes' | 'todo';

@Component({
  selector: 'sd-reportes',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reportes.component.html',
  styleUrl: './reportes.component.scss',
})
export class ReportesComponent implements OnInit {
  readonly resumen = signal<ResumenFinanciero | null>(null);
  readonly cargando = signal(true);
  readonly error = signal<string | null>(null);
  readonly rango = signal<Rango>('mes');

  constructor(private readonly reportesService: ReportesService) {}

  ngOnInit(): void {
    this.cargar();
  }

  cambiarRango(rango: Rango): void {
    this.rango.set(rango);
    this.cargar();
  }

  private cargar(): void {
    this.cargando.set(true);
    const { desde, hasta } = this.calcularFechas();
    this.reportesService.resumen(desde, hasta).subscribe({
      next: (resumen) => {
        this.resumen.set(resumen);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('No se pudo cargar el reporte.');
        this.cargando.set(false);
      },
    });
  }

  private calcularFechas(): { desde?: string; hasta?: string } {
    if (this.rango() === 'todo') {
      return {};
    }
    const hoy = new Date();
    const fmt = (d: Date) => d.toISOString().slice(0, 10);

    if (this.rango() === 'hoy') {
      return { desde: fmt(hoy), hasta: fmt(hoy) };
    }
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    return { desde: fmt(inicioMes), hasta: fmt(hoy) };
  }

  get margen(): number | null {
    const r = this.resumen();
    if (!r || Number(r.ingresos) === 0) {
      return null;
    }
    return (Number(r.ganancia_neta) / Number(r.ingresos)) * 100;
  }
}

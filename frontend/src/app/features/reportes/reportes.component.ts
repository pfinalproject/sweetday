import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { ConfirmService } from '../../shared/confirm/confirm.service';
import { ModalComponent } from '../../shared/modal/modal.component';
import { CompraHistorial, ComprasService } from '../productos/compras.service';
import { CajaService, TurnoCajaDetalle, TurnoCajaHistorial } from '../ventas/caja.service';
import { ResumenFinanciero, ReportesService } from './reportes.service';

type Rango = 'hoy' | 'mes' | 'todo';
type Vista = 'resumen' | 'compras' | 'turnos';

@Component({
  selector: 'sd-reportes',
  standalone: true,
  imports: [CommonModule, ModalComponent],
  templateUrl: './reportes.component.html',
  styleUrl: './reportes.component.scss',
})
export class ReportesComponent implements OnInit {
  readonly vista = signal<Vista>('resumen');
  readonly resumen = signal<ResumenFinanciero | null>(null);
  readonly compras = signal<CompraHistorial[]>([]);
  readonly turnos = signal<TurnoCajaHistorial[]>([]);
  readonly cargando = signal(true);
  readonly error = signal<string | null>(null);
  readonly rango = signal<Rango>('mes');

  readonly turnoDetalle = signal<TurnoCajaDetalle | null>(null);
  readonly cargandoDetalle = signal(false);

  constructor(
    private readonly reportesService: ReportesService,
    private readonly comprasService: ComprasService,
    private readonly cajaService: CajaService,
    private readonly confirmService: ConfirmService,
  ) {}

  ngOnInit(): void {
    this.cargar();
  }

  cambiarVista(vista: Vista): void {
    this.vista.set(vista);
    this.cargar();
  }

  cambiarRango(rango: Rango): void {
    this.rango.set(rango);
    this.cargar();
  }

  private cargar(): void {
    this.cargando.set(true);
    this.error.set(null);
    const { desde, hasta } = this.calcularFechas();

    if (this.vista() === 'compras') {
      this.comprasService.listar(desde, hasta).subscribe({
        next: (compras) => {
          this.compras.set(compras);
          this.cargando.set(false);
        },
        error: () => {
          this.error.set('No se pudo cargar el historial de compras.');
          this.cargando.set(false);
        },
      });
      return;
    }

    if (this.vista() === 'turnos') {
      this.cajaService.listar(desde, hasta).subscribe({
        next: (turnos) => {
          this.turnos.set(turnos);
          this.cargando.set(false);
        },
        error: () => {
          this.error.set('No se pudo cargar el historial de turnos de caja.');
          this.cargando.set(false);
        },
      });
      return;
    }

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

  async cancelarCompra(compra: CompraHistorial): Promise<void> {
    const confirmado = await this.confirmService.pedir(
      `¿Anular esta compra de ${compra.cantidad} unidad(es) de "${compra.nombre_producto}"? Se le va a restar ese stock al producto.`,
      'Anular compra',
      'Anular',
    );
    if (!confirmado) {
      return;
    }
    this.comprasService.anular(compra.id).subscribe({
      next: () => this.cargar(),
      error: (err) => {
        this.error.set(err.error?.detail ?? 'No se pudo anular la compra.');
      },
    });
  }

  verDetalle(turno: TurnoCajaHistorial): void {
    this.cargandoDetalle.set(true);
    this.turnoDetalle.set(null);
    this.cajaService.detalle(turno.id).subscribe({
      next: (detalle) => {
        this.turnoDetalle.set(detalle);
        this.cargandoDetalle.set(false);
      },
      error: () => {
        this.cargandoDetalle.set(false);
        this.error.set('No se pudo cargar el detalle del turno.');
      },
    });
  }

  cerrarDetalle(): void {
    this.turnoDetalle.set(null);
  }

  get margen(): number | null {
    const r = this.resumen();
    if (!r || Number(r.ingresos) === 0) {
      return null;
    }
    return (Number(r.ganancia_neta) / Number(r.ingresos)) * 100;
  }
}

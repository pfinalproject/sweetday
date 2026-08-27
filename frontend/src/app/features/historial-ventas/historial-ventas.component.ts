import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/auth/auth.service';
import { ConfirmService } from '../../shared/confirm/confirm.service';
import { ModalComponent } from '../../shared/modal/modal.component';
import { TicketComponent } from '../../shared/ticket/ticket.component';
import { Venta, VentasService } from '../ventas/ventas.service';

@Component({
  selector: 'sd-historial-ventas',
  standalone: true,
  imports: [CommonModule, FormsModule, TicketComponent, ModalComponent],
  templateUrl: './historial-ventas.component.html',
})
export class HistorialVentasComponent implements OnInit {
  private readonly auth = inject(AuthService);
  readonly esAdmin = this.auth.esAdmin;

  readonly ventas = signal<Venta[]>([]);
  readonly cargando = signal(true);
  readonly error = signal<string | null>(null);
  readonly ticket = signal<Venta | null>(null);
  readonly ventaADevolver = signal<Venta | null>(null);
  readonly errorDevolucion = signal<string | null>(null);
  motivoDevolucion = '';

  desde = '';
  hasta = '';

  constructor(
    private readonly ventasService: VentasService,
    private readonly confirmService: ConfirmService,
  ) {}

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.ventasService.listar(this.desde || undefined, this.hasta || undefined).subscribe({
      next: (ventas) => {
        this.ventas.set(ventas);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('No se pudo cargar el historial de ventas.');
        this.cargando.set(false);
      },
    });
  }

  limpiarFiltro(): void {
    this.desde = '';
    this.hasta = '';
    this.cargar();
  }

  numArticulos(venta: Venta): number {
    return venta.detalles.reduce((acc, d) => acc + d.cantidad, 0);
  }

  async cancelar(venta: Venta): Promise<void> {
    const confirmado = await this.confirmService.pedir(
      `¿Anular esta venta de Bs ${venta.total}? El stock de los productos vendidos se repondrá.`,
      'Anular venta',
      'Anular',
    );
    if (!confirmado) {
      return;
    }
    this.ventasService.anular(venta.id).subscribe(() => this.cargar());
  }

  abrirDevolucion(venta: Venta): void {
    this.ventaADevolver.set(venta);
    this.motivoDevolucion = '';
    this.errorDevolucion.set(null);
  }

  cerrarDevolucion(): void {
    this.ventaADevolver.set(null);
  }

  confirmarDevolucion(): void {
    const venta = this.ventaADevolver();
    const motivo = this.motivoDevolucion.trim();
    if (!venta || !motivo) {
      this.errorDevolucion.set('Escribe el motivo de la devolución.');
      return;
    }
    this.ventasService.devolver(venta.id, motivo).subscribe({
      next: () => {
        this.cerrarDevolucion();
        this.cargar();
      },
      error: (err) => {
        this.errorDevolucion.set(err.error?.detail ?? 'No se pudo registrar la devolución.');
      },
    });
  }
}

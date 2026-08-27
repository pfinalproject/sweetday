import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/auth/auth.service';
import { ConfirmService } from '../../shared/confirm/confirm.service';
import { TicketComponent } from '../../shared/ticket/ticket.component';
import { Venta, VentasService } from '../ventas/ventas.service';

@Component({
  selector: 'sd-historial-ventas',
  standalone: true,
  imports: [CommonModule, FormsModule, TicketComponent],
  templateUrl: './historial-ventas.component.html',
})
export class HistorialVentasComponent implements OnInit {
  private readonly auth = inject(AuthService);
  readonly esAdmin = this.auth.esAdmin;

  readonly ventas = signal<Venta[]>([]);
  readonly cargando = signal(true);
  readonly error = signal<string | null>(null);
  readonly ticket = signal<Venta | null>(null);

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
}

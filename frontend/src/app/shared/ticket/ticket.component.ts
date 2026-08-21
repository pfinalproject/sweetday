import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Venta, VentaDetalle } from '../../features/ventas/ventas.service';

@Component({
  selector: 'sd-ticket',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ticket.component.html',
  styleUrl: './ticket.component.scss',
})
export class TicketComponent {
  @Input({ required: true }) venta!: Venta;
  @Output() cerrar = new EventEmitter<void>();

  imprimir(): void {
    window.print();
  }

  get folio(): string {
    return this.venta.id.slice(0, 8).toUpperCase();
  }

  subtotal(detalle: VentaDetalle): string {
    return (detalle.cantidad * Number(detalle.precio_unitario)).toFixed(2);
  }
}

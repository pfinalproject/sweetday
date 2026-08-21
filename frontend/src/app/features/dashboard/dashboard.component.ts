import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { AlertasService } from '../../core/alertas/alertas.service';
import { CajaService, TurnoCaja } from '../ventas/caja.service';
import { Venta, VentasService } from '../ventas/ventas.service';
import { ProductoTendencia, ReportesService, ResumenFinanciero } from '../reportes/reportes.service';

function hoyISO(): string {
  const ahora = new Date();
  const offset = ahora.getTimezoneOffset();
  const local = new Date(ahora.getTime() - offset * 60000);
  return local.toISOString().slice(0, 10);
}

@Component({
  selector: 'sd-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly cajaService = inject(CajaService);
  private readonly ventasService = inject(VentasService);
  private readonly reportesService = inject(ReportesService);
  private readonly alertasService = inject(AlertasService);

  readonly usuario = this.auth.usuario;

  readonly cargando = signal(true);
  readonly error = signal<string | null>(null);

  readonly caja = signal<TurnoCaja | null>(null);
  readonly resumenHoy = signal<ResumenFinanciero | null>(null);
  readonly ventasHoy = signal<Venta[]>([]);

  readonly cargandoTendencias = signal(true);
  readonly tendencias = signal<ProductoTendencia[]>([]);

  readonly cargadoStock = this.alertasService.cargado;
  readonly stockBajo = computed(() => this.alertasService.criticos().slice(0, 6));

  readonly ultimasVentas = computed(() => this.ventasHoy().slice(0, 5));

  readonly gananciaHoy = computed(() => Number(this.resumenHoy()?.ganancia_neta ?? 0));

  readonly fechaHoy = new Date().toLocaleDateString('es-BO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  ngOnInit(): void {
    const hoy = hoyISO();

    this.cajaService.actual().subscribe({ next: (turno) => this.caja.set(turno), error: () => this.caja.set(null) });

    this.alertasService.iniciar();

    this.reportesService.resumen(hoy, hoy).subscribe({
      next: (resumen) => {
        this.resumenHoy.set(resumen);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('No se pudo cargar el resumen del día.');
        this.cargando.set(false);
      },
    });

    this.ventasService.listar(hoy, hoy).subscribe({
      next: (ventas) => this.ventasHoy.set(ventas),
      error: () => {},
    });

    this.reportesService.tendencias().subscribe({
      next: (tendencias) => {
        this.tendencias.set(tendencias);
        this.cargandoTendencias.set(false);
      },
      error: () => this.cargandoTendencias.set(false),
    });
  }
}

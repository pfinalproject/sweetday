import { Injectable, computed, inject, signal } from '@angular/core';
import { interval, startWith, switchMap } from 'rxjs';
import { Producto } from '../../shared/models/producto.model';
import { ProductosService } from '../../features/productos/productos.service';

export const UMBRAL_STOCK_BAJO = 10;
const INTERVALO_REFRESCO_MS = 60_000;

/** Fuente única de alertas de stock, compartida entre la campanita, el Dashboard y la página de Alertas. */
@Injectable({ providedIn: 'root' })
export class AlertasService {
  private readonly productosService = inject(ProductosService);

  private readonly productos = signal<Producto[]>([]);
  private readonly cargadoSignal = signal(false);
  private iniciado = false;

  readonly cargado = this.cargadoSignal.asReadonly();

  readonly sinStock = computed(() =>
    this.productos()
      .filter((p) => p.stock === 0)
      .sort((a, b) => a.nombre.localeCompare(b.nombre)),
  );

  readonly stockBajo = computed(() =>
    this.productos()
      .filter((p) => p.stock > 0 && p.stock < UMBRAL_STOCK_BAJO)
      .sort((a, b) => a.stock - b.stock),
  );

  /** Sin stock primero (más urgente), luego stock bajo de menor a mayor. */
  readonly criticos = computed(() => [...this.sinStock(), ...this.stockBajo()]);

  readonly total = computed(() => this.criticos().length);

  /** Idempotente: la primera vez arranca el refresco periódico, después no hace nada. */
  iniciar(): void {
    if (this.iniciado) {
      return;
    }
    this.iniciado = true;
    interval(INTERVALO_REFRESCO_MS)
      .pipe(
        startWith(0),
        switchMap(() => this.productosService.listar(true)),
      )
      .subscribe((productos) => {
        this.productos.set(productos);
        this.cargadoSignal.set(true);
      });
  }

  refrescar(): void {
    this.productosService.listar(true).subscribe((productos) => {
      this.productos.set(productos);
      this.cargadoSignal.set(true);
    });
  }
}

import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/auth/auth.service';
import { BarcodeScannerComponent } from '../../shared/barcode-scanner/barcode-scanner.component';
import { TicketComponent } from '../../shared/ticket/ticket.component';
import { Producto } from '../../shared/models/producto.model';
import { ProductosService } from '../productos/productos.service';
import { CajaService, TurnoCaja } from './caja.service';
import { Venta, VentasService } from './ventas.service';

interface LineaCarrito {
  producto: Producto;
  cantidad: number;
}

@Component({
  selector: 'sd-ventas',
  standalone: true,
  imports: [CommonModule, FormsModule, TicketComponent, BarcodeScannerComponent],
  templateUrl: './ventas.component.html',
  styleUrl: './ventas.component.scss',
})
export class VentasComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly cajaService = inject(CajaService);
  private readonly productosService = inject(ProductosService);
  private readonly ventasService = inject(VentasService);

  readonly esDuena = this.auth.esDuena;

  readonly cargandoCaja = signal(true);
  readonly caja = signal<TurnoCaja | null>(null);
  readonly productos = signal<Producto[]>([]);
  readonly carrito = signal<LineaCarrito[]>([]);

  readonly mostrarAbrirCaja = signal(false);
  readonly mostrarCerrarCaja = signal(false);
  readonly procesandoCaja = signal(false);
  readonly procesandoCobro = signal(false);
  readonly error = signal<string | null>(null);
  readonly ticket = signal<Venta | null>(null);
  readonly mostrarScanner = signal(false);

  montoApertura: number | null = null;
  montoCierre: number | null = null;
  busqueda = '';

  readonly productosFiltrados = computed(() => {
    const termino = this.busqueda.trim().toLowerCase();
    return this.productos()
      .filter((p) => p.stock > 0)
      .filter((p) => !termino || p.nombre.toLowerCase().includes(termino));
  });

  readonly total = computed(() =>
    this.carrito().reduce((acc, linea) => acc + Number(linea.producto.precio) * linea.cantidad, 0),
  );

  ngOnInit(): void {
    this.cargarCaja();
    this.productosService.listar(true).subscribe((productos) => this.productos.set(productos));
  }

  private cargarCaja(): void {
    this.cargandoCaja.set(true);
    this.cajaService.actual().subscribe({
      next: (turno) => {
        this.caja.set(turno);
        this.cargandoCaja.set(false);
      },
      error: () => this.cargandoCaja.set(false),
    });
  }

  abrirCaja(): void {
    if (this.montoApertura === null || this.montoApertura < 0) {
      this.error.set('Ingresa un monto de apertura válido.');
      return;
    }
    this.procesandoCaja.set(true);
    this.error.set(null);
    this.cajaService.abrir(this.montoApertura).subscribe({
      next: (turno) => {
        this.caja.set(turno);
        this.mostrarAbrirCaja.set(false);
        this.procesandoCaja.set(false);
        this.montoApertura = null;
      },
      error: () => {
        this.procesandoCaja.set(false);
        this.error.set('No se pudo abrir la caja.');
      },
    });
  }

  cerrarCaja(): void {
    const turno = this.caja();
    if (!turno || this.montoCierre === null || this.montoCierre < 0) {
      this.error.set('Ingresa un monto de cierre válido.');
      return;
    }
    this.procesandoCaja.set(true);
    this.error.set(null);
    this.cajaService.cerrar(turno.id, this.montoCierre).subscribe({
      next: () => {
        this.caja.set(null);
        this.carrito.set([]);
        this.mostrarCerrarCaja.set(false);
        this.procesandoCaja.set(false);
        this.montoCierre = null;
      },
      error: () => {
        this.procesandoCaja.set(false);
        this.error.set('No se pudo cerrar la caja.');
      },
    });
  }

  agregarAlCarrito(producto: Producto): void {
    const carrito = this.carrito();
    const existente = carrito.find((l) => l.producto.id === producto.id);
    if (existente) {
      if (existente.cantidad < producto.stock) {
        existente.cantidad += 1;
        this.carrito.set([...carrito]);
      }
      return;
    }
    this.carrito.set([...carrito, { producto, cantidad: 1 }]);
  }

  cambiarCantidad(linea: LineaCarrito, delta: number): void {
    const nueva = linea.cantidad + delta;
    if (nueva < 1 || nueva > linea.producto.stock) {
      return;
    }
    linea.cantidad = nueva;
    this.carrito.set([...this.carrito()]);
  }

  quitarLinea(linea: LineaCarrito): void {
    this.carrito.set(this.carrito().filter((l) => l !== linea));
  }

  onCodigoEscaneado(codigo: string): void {
    const producto = this.productos().find((p) => p.codigo_barras === codigo);
    if (!producto) {
      this.error.set(`No se encontró ningún producto con el código ${codigo}.`);
      return;
    }
    if (producto.stock <= 0) {
      this.error.set(`"${producto.nombre}" está sin stock.`);
      return;
    }
    this.error.set(null);
    this.agregarAlCarrito(producto);
  }

  cobrar(): void {
    if (this.carrito().length === 0) {
      return;
    }
    this.procesandoCobro.set(true);
    this.error.set(null);

    const items = this.carrito().map((l) => ({ producto_id: l.producto.id, cantidad: l.cantidad }));
    this.ventasService.crear(items).subscribe({
      next: (venta) => {
        this.procesandoCobro.set(false);
        this.ticket.set(venta);
        this.carrito.set([]);
        this.productosService.listar(true).subscribe((productos) => this.productos.set(productos));
      },
      error: (err) => {
        this.procesandoCobro.set(false);
        this.error.set(err.error?.detail ?? 'No se pudo registrar la venta.');
      },
    });
  }
}

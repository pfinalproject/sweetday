import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/auth/auth.service';
import { BarcodeScannerComponent } from '../../shared/barcode-scanner/barcode-scanner.component';
import { CapturaFotoComponent } from '../../shared/captura-foto/captura-foto.component';
import { ConfirmService } from '../../shared/confirm/confirm.service';
import { ModalComponent } from '../../shared/modal/modal.component';
import { TicketComponent } from '../../shared/ticket/ticket.component';
import { Categoria, Producto, ProductoReconocido } from '../../shared/models/producto.model';
import { CategoriasService } from '../categorias/categorias.service';
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
  imports: [CommonModule, FormsModule, TicketComponent, BarcodeScannerComponent, ModalComponent, CapturaFotoComponent],
  templateUrl: './ventas.component.html',
  styleUrl: './ventas.component.scss',
})
export class VentasComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly cajaService = inject(CajaService);
  private readonly productosService = inject(ProductosService);
  private readonly categoriasService = inject(CategoriasService);
  private readonly ventasService = inject(VentasService);
  private readonly confirmService = inject(ConfirmService);

  readonly esAdmin = this.auth.esAdmin;

  readonly cargandoCaja = signal(true);
  readonly caja = signal<TurnoCaja | null>(null);
  readonly productos = signal<Producto[]>([]);
  readonly categorias = signal<Categoria[]>([]);
  readonly categoriaSeleccionada = signal<string>('todas');
  readonly carrito = signal<LineaCarrito[]>([]);

  readonly mostrarAbrirCaja = signal(false);
  readonly mostrarCerrarCaja = signal(false);
  readonly procesandoCaja = signal(false);
  readonly procesandoCobro = signal(false);
  readonly error = signal<string | null>(null);
  readonly ticket = signal<Venta | null>(null);
  readonly mostrarScanner = signal(false);

  readonly mostrarReconocer = signal(false);
  readonly reconociendo = signal(false);
  readonly errorReconocer = signal<string | null>(null);
  readonly resultadosReconocer = signal<ProductoReconocido[] | null>(null);

  montoApertura: number | null = null;
  montoCierre: number | null = null;
  readonly busqueda = signal('');
  readonly toast = signal<string | null>(null);
  private toastTimeoutId?: ReturnType<typeof setTimeout>;

  readonly porPagina = 9;
  readonly paginaActual = signal(1);

  readonly productosFiltrados = computed(() => {
    const termino = this.busqueda().trim().toLowerCase();
    const categoria = this.categoriaSeleccionada();
    return this.productos()
      .filter((p) => p.stock > 0)
      .filter((p) => p.categoria.activo)
      .filter((p) => categoria === 'todas' || p.categoria.id === categoria)
      .filter((p) => !termino || p.nombre.toLowerCase().includes(termino));
  });

  readonly totalPaginas = computed(() =>
    Math.max(1, Math.ceil(this.productosFiltrados().length / this.porPagina)),
  );

  readonly paginaSegura = computed(() => Math.min(this.paginaActual(), this.totalPaginas()));

  readonly productosPagina = computed(() => {
    const inicio = (this.paginaSegura() - 1) * this.porPagina;
    return this.productosFiltrados().slice(inicio, inicio + this.porPagina);
  });

  readonly numerosPagina = computed(() => {
    const total = this.totalPaginas();
    const actual = this.paginaSegura();
    const ventana = 5;
    let inicio = Math.max(1, actual - Math.floor(ventana / 2));
    const fin = Math.min(total, inicio + ventana - 1);
    inicio = Math.max(1, fin - ventana + 1);
    return Array.from({ length: fin - inicio + 1 }, (_, i) => inicio + i);
  });

  readonly total = computed(() =>
    this.carrito().reduce((acc, linea) => acc + Number(linea.producto.precio) * linea.cantidad, 0),
  );

  readonly cantidadItems = computed(() => this.carrito().reduce((acc, linea) => acc + linea.cantidad, 0));

  readonly carritoAbierto = signal(false);

  ngOnInit(): void {
    this.cargarCaja();
    this.productosService.listar(true).subscribe((productos) => this.productos.set(productos));
    this.categoriasService.listar().subscribe((categorias) => this.categorias.set(categorias));
  }

  cambiarCategoria(categoriaId: string): void {
    this.categoriaSeleccionada.set(categoriaId);
    this.paginaActual.set(1);
  }

  /** Cuánto queda visualmente disponible de un producto restando lo que ya está en el
   * carrito (sin tocar el stock real — recién se descuenta de verdad al cobrar). */
  stockVisible(producto: Producto): number {
    const enCarrito = this.carrito().find((l) => l.producto.id === producto.id)?.cantidad ?? 0;
    return producto.stock - enCarrito;
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
    if (!producto.categoria.activo) {
      this.error.set(`"${producto.nombre}" pertenece a una categoría inactiva y no se puede vender.`);
      return;
    }
    const carrito = this.carrito();
    const existente = carrito.find((l) => l.producto.id === producto.id);
    if (existente) {
      if (existente.cantidad >= producto.stock) {
        this.error.set(`No hay más stock disponible de "${producto.nombre}".`);
        return;
      }
      existente.cantidad += 1;
      this.carrito.set([...carrito]);
    } else {
      this.carrito.set([...carrito, { producto, cantidad: 1 }]);
    }
    this.error.set(null);
    this.mostrarToast(`${producto.nombre} agregado`);
  }

  private mostrarToast(mensaje: string): void {
    this.toast.set(mensaje);
    clearTimeout(this.toastTimeoutId);
    this.toastTimeoutId = setTimeout(() => this.toast.set(null), 1600);
  }

  onBusquedaChange(valor: string): void {
    this.busqueda.set(valor);
    this.paginaActual.set(1);
  }

  irAPagina(pagina: number): void {
    this.paginaActual.set(Math.min(Math.max(1, pagina), this.totalPaginas()));
  }

  paginaAnterior(): void {
    this.irAPagina(this.paginaSegura() - 1);
  }

  paginaSiguiente(): void {
    this.irAPagina(this.paginaSegura() + 1);
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

  // ---- Reconocer producto sin codigo de barras (por foto) ----

  abrirReconocer(): void {
    this.resultadosReconocer.set(null);
    this.errorReconocer.set(null);
    this.mostrarReconocer.set(true);
  }

  onArchivoReconocer(event: Event): void {
    const input = event.target as HTMLInputElement;
    const archivo = input.files?.[0];
    input.value = '';
    if (!archivo) {
      return;
    }
    this.procesarArchivoReconocer(archivo);
  }

  procesarArchivoReconocer(archivo: File): void {
    this.reconociendo.set(true);
    this.errorReconocer.set(null);
    this.resultadosReconocer.set(null);
    this.productosService.reconocer(archivo).subscribe({
      next: (resultados) => {
        this.reconociendo.set(false);
        this.resultadosReconocer.set(resultados);
      },
      error: () => {
        this.reconociendo.set(false);
        this.errorReconocer.set('No se pudo procesar la imagen. Intenta de nuevo.');
      },
    });
  }

  fotoUrl(producto: Producto): string {
    return this.productosService.fotoUrl(producto.id);
  }

  elegirReconocido(producto: Producto): void {
    this.mostrarReconocer.set(false);
    if (producto.stock <= 0) {
      this.error.set(`"${producto.nombre}" está sin stock.`);
      return;
    }
    this.error.set(null);
    this.agregarAlCarrito(producto);
  }

  async cobrar(): Promise<void> {
    if (this.carrito().length === 0) {
      return;
    }
    const ok = await this.confirmService.pedir(
      `¿Confirmar el cobro de Bs ${this.total().toFixed(2)}?`,
      'Confirmar venta',
      'Cobrar',
    );
    if (!ok) {
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
        this.carritoAbierto.set(false);
        this.paginaActual.set(1);
        this.productosService.listar(true).subscribe((productos) => this.productos.set(productos));
      },
      error: (err) => {
        this.procesandoCobro.set(false);
        this.error.set(err.error?.detail ?? 'No se pudo registrar la venta.');
      },
    });
  }
}

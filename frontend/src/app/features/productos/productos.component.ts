import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CategoriasService } from '../categorias/categorias.service';
import { ProveedoresService } from '../proveedores/proveedores.service';
import { BarcodeScannerComponent } from '../../shared/barcode-scanner/barcode-scanner.component';
import { ConfirmService } from '../../shared/confirm/confirm.service';
import { ModalComponent } from '../../shared/modal/modal.component';
import { Categoria, Producto, ProductoReconocido, Proveedor } from '../../shared/models/producto.model';
import { nombreValido } from '../../shared/validacion';
import { ComprasService } from './compras.service';
import { OpenFoodFactsService } from './open-food-facts.service';
import { ProductoForm, ProductosService } from './productos.service';

const FORM_VACIO: ProductoForm = {
  nombre: '',
  codigo_barras: null,
  precio: 0,
  costo: 0,
  stock: 0,
  categoria_id: '',
  proveedor_id: '',
  imagen_url: null,
};

@Component({
  selector: 'sd-productos',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent, BarcodeScannerComponent],
  templateUrl: './productos.component.html',
  styleUrl: './productos.component.scss',
})
export class ProductosComponent implements OnInit {
  readonly productos = signal<Producto[]>([]);
  readonly categorias = signal<Categoria[]>([]);
  readonly proveedores = signal<Proveedor[]>([]);
  readonly cargando = signal(true);
  readonly error = signal<string | null>(null);
  readonly vista = signal<'activos' | 'inactivos'>('activos');
  readonly modalAbierto = signal(false);
  readonly guardando = signal(false);
  readonly errorForm = signal<string | null>(null);
  readonly editando = signal<Producto | null>(null);

  readonly mostrarScanner = signal(false);
  readonly buscandoInfoExterna = signal(false);
  readonly avisoEscaneo = signal<string | null>(null);
  readonly sinResultadoExterno = signal(false);

  readonly reabasteciendo = signal<Producto | null>(null);
  readonly guardandoCompra = signal(false);
  readonly errorCompra = signal<string | null>(null);
  cantidadCompra = 1;
  costoCompra = 0;

  readonly subiendoFoto = signal(false);
  readonly errorFoto = signal<string | null>(null);

  readonly mostrarReconocer = signal(false);
  readonly reconociendo = signal(false);
  readonly errorReconocer = signal<string | null>(null);
  readonly resultadosReconocer = signal<ProductoReconocido[] | null>(null);

  busqueda = '';
  form: ProductoForm = { ...FORM_VACIO };

  readonly productosFiltrados = computed(() => {
    const termino = this.busqueda.trim().toLowerCase();
    if (!termino) {
      return this.productos();
    }
    return this.productos().filter((producto) => producto.nombre.toLowerCase().includes(termino));
  });

  constructor(
    private readonly productosService: ProductosService,
    private readonly categoriasService: CategoriasService,
    private readonly proveedoresService: ProveedoresService,
    private readonly comprasService: ComprasService,
    private readonly openFoodFacts: OpenFoodFactsService,
    private readonly confirmService: ConfirmService,
  ) {}

  ngOnInit(): void {
    this.categoriasService.listar().subscribe((categorias) => this.categorias.set(categorias));
    this.proveedoresService.listar().subscribe((proveedores) => this.proveedores.set(proveedores));
    this.cargar();
  }

  cambiarVista(vista: 'activos' | 'inactivos'): void {
    this.vista.set(vista);
    this.cargar();
  }

  private cargar(): void {
    this.cargando.set(true);
    this.productosService.listar(this.vista() === 'activos').subscribe({
      next: (productos) => {
        this.productos.set(productos);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('No se pudo cargar el inventario. Verifica que el backend esté corriendo.');
        this.cargando.set(false);
      },
    });
  }

  abrirCrear(): void {
    if (this.proveedores().length === 0) {
      this.errorForm.set(null);
      this.error.set('Registra al menos un proveedor antes de crear productos.');
      return;
    }
    this.editando.set(null);
    this.form = {
      ...FORM_VACIO,
      categoria_id: this.categorias()[0]?.id ?? '',
      proveedor_id: this.proveedores()[0]?.id ?? '',
    };
    this.errorForm.set(null);
    this.sinResultadoExterno.set(false);
    this.modalAbierto.set(true);
  }

  abrirEditar(producto: Producto): void {
    this.editando.set(producto);
    this.form = {
      nombre: producto.nombre,
      codigo_barras: producto.codigo_barras,
      precio: Number(producto.precio),
      costo: Number(producto.costo),
      stock: producto.stock,
      categoria_id: producto.categoria.id,
      proveedor_id: producto.proveedor.id,
      imagen_url: producto.imagen_url,
    };
    this.errorForm.set(null);
    this.sinResultadoExterno.set(false);
    this.modalAbierto.set(true);
  }

  guardar(): void {
    if (!nombreValido(this.form.nombre)) {
      this.errorForm.set('Ingresa un nombre válido (sin símbolos raros, máximo 120 caracteres).');
      return;
    }
    if (
      !this.form.categoria_id ||
      !this.form.proveedor_id ||
      this.form.precio <= 0 ||
      this.form.costo < 0 ||
      this.form.stock < 0
    ) {
      this.errorForm.set('Completa categoría, proveedor, y un costo, precio y stock válidos (no negativos).');
      return;
    }

    this.guardando.set(true);
    const editando = this.editando();
    const peticion = editando
      ? this.productosService.actualizar(editando.id, this.form)
      : this.productosService.crear(this.form);

    peticion.subscribe({
      next: () => {
        this.guardando.set(false);
        this.modalAbierto.set(false);
        this.cargar();
      },
      error: () => {
        this.guardando.set(false);
        this.errorForm.set('No se pudo guardar el producto.');
      },
    });
  }

  async desactivar(producto: Producto): Promise<void> {
    const confirmado = await this.confirmService.pedir(`¿Desactivar "${producto.nombre}"?`, 'Desactivar producto');
    if (!confirmado) {
      return;
    }
    this.productosService.desactivar(producto.id).subscribe(() => this.cargar());
  }

  fotoUrl(producto: Producto): string {
    return this.productosService.fotoUrl(producto.id);
  }

  // ---- Foto del producto (para reconocimiento visual) ----

  onArchivoFoto(event: Event): void {
    const editando = this.editando();
    const input = event.target as HTMLInputElement;
    const archivo = input.files?.[0];
    input.value = '';
    if (!editando || !archivo) {
      return;
    }

    this.subiendoFoto.set(true);
    this.errorFoto.set(null);
    this.productosService.subirFoto(editando.id, archivo).subscribe({
      next: (actualizado) => {
        this.subiendoFoto.set(false);
        this.editando.set(actualizado);
        this.cargar();
      },
      error: () => {
        this.subiendoFoto.set(false);
        this.errorFoto.set('No se pudo subir la foto. Intenta con otra imagen (JPEG, PNG o WEBP, hasta 8MB).');
      },
    });
  }

  // ---- Reconocer producto por foto ----

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

  elegirReconocido(producto: Producto): void {
    this.mostrarReconocer.set(false);
    this.abrirEditar(producto);
  }

  // ---- Escaneo de codigo de barras ----

  abrirScanner(): void {
    if (this.proveedores().length === 0) {
      this.error.set('Registra al menos un proveedor antes de crear productos.');
      return;
    }
    this.avisoEscaneo.set(null);
    this.mostrarScanner.set(true);
  }

  onCodigoDetectado(codigo: string): void {
    this.mostrarScanner.set(false);

    this.productosService.buscarPorCodigo(codigo).subscribe((existente) => {
      if (existente) {
        this.avisoEscaneo.set(`"${existente.nombre}" ya está registrado con ese código — abriendo para editar.`);
        this.abrirEditar(existente);
        return;
      }

      this.editando.set(null);
      this.form = {
        ...FORM_VACIO,
        codigo_barras: codigo,
        categoria_id: this.categorias()[0]?.id ?? '',
        proveedor_id: this.proveedores()[0]?.id ?? '',
      };
      this.errorForm.set(null);
      this.modalAbierto.set(true);
      this.buscandoInfoExterna.set(true);
      this.sinResultadoExterno.set(false);

      this.openFoodFacts.buscarPorCodigo(codigo).subscribe((info) => {
        this.buscandoInfoExterna.set(false);
        if (!info) {
          this.sinResultadoExterno.set(true);
          return;
        }
        this.form = { ...this.form, nombre: info.nombre, imagen_url: info.imagenUrl };
      });
    });
  }

  // ---- Reabastecer (compra a proveedor) ----

  abrirReabastecer(producto: Producto): void {
    this.reabasteciendo.set(producto);
    this.cantidadCompra = 1;
    this.costoCompra = Number(producto.costo);
    this.errorCompra.set(null);
  }

  registrarCompra(): void {
    const producto = this.reabasteciendo();
    if (!producto || this.cantidadCompra <= 0 || this.costoCompra < 0) {
      this.errorCompra.set('Ingresa una cantidad y un costo válidos.');
      return;
    }
    this.guardandoCompra.set(true);
    this.comprasService.registrar(producto.id, this.cantidadCompra, this.costoCompra).subscribe({
      next: () => {
        this.guardandoCompra.set(false);
        this.reabasteciendo.set(null);
        this.cargar();
      },
      error: () => {
        this.guardandoCompra.set(false);
        this.errorCompra.set('No se pudo registrar la compra.');
      },
    });
  }
}

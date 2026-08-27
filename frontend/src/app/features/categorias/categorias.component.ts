import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/auth/auth.service';
import { ConfirmService } from '../../shared/confirm/confirm.service';
import { ModalComponent } from '../../shared/modal/modal.component';
import { Categoria } from '../../shared/models/producto.model';
import { nombreValido } from '../../shared/validacion';
import { CategoriasService } from './categorias.service';

@Component({
  selector: 'sd-categorias',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent],
  templateUrl: './categorias.component.html',
})
export class CategoriasComponent implements OnInit {
  private readonly auth = inject(AuthService);
  readonly esAdmin = this.auth.esAdmin;

  readonly categorias = signal<Categoria[]>([]);
  readonly cargando = signal(true);
  readonly error = signal<string | null>(null);
  readonly vista = signal<'activos' | 'inactivos'>('activos');
  readonly modalAbierto = signal(false);
  readonly guardando = signal(false);
  readonly errorForm = signal<string | null>(null);
  readonly editando = signal<Categoria | null>(null);

  nombreNueva = '';

  constructor(
    private readonly categoriasService: CategoriasService,
    private readonly confirmService: ConfirmService,
  ) {}

  ngOnInit(): void {
    this.cargar();
  }

  cambiarVista(vista: 'activos' | 'inactivos'): void {
    this.vista.set(vista);
    this.cargar();
  }

  private cargar(): void {
    this.cargando.set(true);
    this.categoriasService.listar(this.vista() === 'activos').subscribe({
      next: (categorias) => {
        this.categorias.set(categorias);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('No se pudo cargar las categorías.');
        this.cargando.set(false);
      },
    });
  }

  abrirCrear(): void {
    this.editando.set(null);
    this.nombreNueva = '';
    this.errorForm.set(null);
    this.modalAbierto.set(true);
  }

  abrirEditar(categoria: Categoria): void {
    this.editando.set(categoria);
    this.nombreNueva = categoria.nombre;
    this.errorForm.set(null);
    this.modalAbierto.set(true);
  }

  guardar(): void {
    if (!nombreValido(this.nombreNueva)) {
      this.errorForm.set('Ingresa un nombre válido (sin símbolos raros, máximo 120 caracteres).');
      return;
    }
    this.errorForm.set(null);
    this.guardando.set(true);
    const editando = this.editando();
    const peticion = editando
      ? this.categoriasService.actualizar(editando.id, this.nombreNueva.trim())
      : this.categoriasService.crear(this.nombreNueva.trim());

    peticion.subscribe({
      next: () => {
        this.guardando.set(false);
        this.modalAbierto.set(false);
        this.cargar();
      },
      error: () => {
        this.guardando.set(false);
        this.errorForm.set('No se pudo guardar la categoría.');
      },
    });
  }

  async toggleEstado(categoria: Categoria): Promise<void> {
    const activar = !categoria.activo;
    if (!activar) {
      const confirmado = await this.confirmService.pedir(
        `¿Desactivar la categoría "${categoria.nombre}"? Sus productos no se podrán vender mientras esté inactiva.`,
        'Desactivar categoría',
      );
      if (!confirmado) {
        return;
      }
    }
    this.categoriasService.cambiarEstado(categoria.id, activar).subscribe(() => this.cargar());
  }
}

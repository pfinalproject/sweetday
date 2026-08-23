import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
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
  readonly categorias = signal<Categoria[]>([]);
  readonly cargando = signal(true);
  readonly error = signal<string | null>(null);
  readonly modalAbierto = signal(false);
  readonly guardando = signal(false);
  readonly errorForm = signal<string | null>(null);

  nombreNueva = '';

  constructor(
    private readonly categoriasService: CategoriasService,
    private readonly confirmService: ConfirmService,
  ) {}

  ngOnInit(): void {
    this.cargar();
  }

  private cargar(): void {
    this.cargando.set(true);
    this.categoriasService.listar().subscribe({
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

  abrirModal(): void {
    this.nombreNueva = '';
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
    this.categoriasService.crear(this.nombreNueva.trim()).subscribe({
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

  async desactivar(categoria: Categoria): Promise<void> {
    const confirmado = await this.confirmService.pedir(
      `¿Desactivar la categoría "${categoria.nombre}"?`,
      'Desactivar categoría',
    );
    if (!confirmado) {
      return;
    }
    this.categoriasService.desactivar(categoria.id).subscribe(() => this.cargar());
  }
}

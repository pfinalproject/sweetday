import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ModalComponent } from '../../shared/modal/modal.component';
import { Categoria } from '../../shared/models/producto.model';
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

  nombreNueva = '';

  constructor(private readonly categoriasService: CategoriasService) {}

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
    this.modalAbierto.set(true);
  }

  guardar(): void {
    if (!this.nombreNueva.trim()) {
      return;
    }
    this.guardando.set(true);
    this.categoriasService.crear(this.nombreNueva.trim()).subscribe({
      next: () => {
        this.guardando.set(false);
        this.modalAbierto.set(false);
        this.cargar();
      },
      error: () => {
        this.guardando.set(false);
      },
    });
  }

  desactivar(categoria: Categoria): void {
    if (!confirm(`¿Desactivar la categoría "${categoria.nombre}"?`)) {
      return;
    }
    this.categoriasService.desactivar(categoria.id).subscribe(() => this.cargar());
  }
}

import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ModalComponent } from '../../shared/modal/modal.component';
import { Proveedor } from '../../shared/models/producto.model';
import { ProveedorForm, ProveedoresService } from './proveedores.service';

const FORM_VACIO: ProveedorForm = { nombre: '', contacto: null, telefono: null };

@Component({
  selector: 'sd-proveedores',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent],
  templateUrl: './proveedores.component.html',
})
export class ProveedoresComponent implements OnInit {
  readonly proveedores = signal<Proveedor[]>([]);
  readonly cargando = signal(true);
  readonly error = signal<string | null>(null);
  readonly modalAbierto = signal(false);
  readonly guardando = signal(false);
  readonly editando = signal<Proveedor | null>(null);

  form: ProveedorForm = { ...FORM_VACIO };

  constructor(private readonly proveedoresService: ProveedoresService) {}

  ngOnInit(): void {
    this.cargar();
  }

  private cargar(): void {
    this.cargando.set(true);
    this.proveedoresService.listar().subscribe({
      next: (proveedores) => {
        this.proveedores.set(proveedores);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('No se pudo cargar los proveedores.');
        this.cargando.set(false);
      },
    });
  }

  abrirCrear(): void {
    this.editando.set(null);
    this.form = { ...FORM_VACIO };
    this.modalAbierto.set(true);
  }

  abrirEditar(proveedor: Proveedor): void {
    this.editando.set(proveedor);
    this.form = { nombre: proveedor.nombre, contacto: proveedor.contacto, telefono: proveedor.telefono };
    this.modalAbierto.set(true);
  }

  guardar(): void {
    if (!this.form.nombre.trim()) {
      return;
    }
    this.guardando.set(true);
    const editando = this.editando();
    const peticion = editando
      ? this.proveedoresService.actualizar(editando.id, this.form)
      : this.proveedoresService.crear(this.form);

    peticion.subscribe({
      next: () => {
        this.guardando.set(false);
        this.modalAbierto.set(false);
        this.cargar();
      },
      error: () => this.guardando.set(false),
    });
  }

  desactivar(proveedor: Proveedor): void {
    if (!confirm(`¿Desactivar al proveedor "${proveedor.nombre}"?`)) {
      return;
    }
    this.proveedoresService.desactivar(proveedor.id).subscribe(() => this.cargar());
  }

  /** Deja solo dígitos y antepone el código de Bolivia (591) si el número no trae código de país. */
  telefonoNormalizado(telefono: string): string {
    const digitos = telefono.replace(/\D/g, '');
    return digitos.length <= 8 ? `591${digitos}` : digitos;
  }
}

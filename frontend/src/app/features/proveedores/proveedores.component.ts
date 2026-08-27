import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ConfirmService } from '../../shared/confirm/confirm.service';
import { ModalComponent } from '../../shared/modal/modal.component';
import { Proveedor } from '../../shared/models/producto.model';
import { nombreOpcionalValido, nombreValido, telefonoValido } from '../../shared/validacion';
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
  readonly vista = signal<'activos' | 'inactivos'>('activos');
  readonly modalAbierto = signal(false);
  readonly guardando = signal(false);
  readonly editando = signal<Proveedor | null>(null);
  readonly errorForm = signal<string | null>(null);

  form: ProveedorForm = { ...FORM_VACIO };

  constructor(
    private readonly proveedoresService: ProveedoresService,
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
    this.proveedoresService.listar(this.vista() === 'activos').subscribe({
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
    this.errorForm.set(null);
    this.modalAbierto.set(true);
  }

  abrirEditar(proveedor: Proveedor): void {
    this.editando.set(proveedor);
    this.form = { nombre: proveedor.nombre, contacto: proveedor.contacto, telefono: proveedor.telefono };
    this.errorForm.set(null);
    this.modalAbierto.set(true);
  }

  guardar(): void {
    if (!nombreValido(this.form.nombre)) {
      this.errorForm.set('Ingresa un nombre válido (sin símbolos raros, máximo 120 caracteres).');
      return;
    }
    if (!nombreOpcionalValido(this.form.contacto)) {
      this.errorForm.set('El contacto no puede tener símbolos raros.');
      return;
    }
    if (!telefonoValido(this.form.telefono)) {
      this.errorForm.set('El teléfono solo puede tener dígitos, espacios, +, - y paréntesis.');
      return;
    }
    this.errorForm.set(null);
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
      error: () => {
        this.guardando.set(false);
        this.errorForm.set('No se pudo guardar el proveedor.');
      },
    });
  }

  async toggleEstado(proveedor: Proveedor): Promise<void> {
    const activar = !proveedor.activo;
    if (!activar) {
      const confirmado = await this.confirmService.pedir(
        `¿Desactivar al proveedor "${proveedor.nombre}"?`,
        'Desactivar proveedor',
      );
      if (!confirmado) {
        return;
      }
    }
    this.proveedoresService.cambiarEstado(proveedor.id, activar).subscribe(() => this.cargar());
  }

  /** Deja solo dígitos y antepone el código de Bolivia (591) si el número no trae código de país. */
  telefonoNormalizado(telefono: string): string {
    const digitos = telefono.replace(/\D/g, '');
    return digitos.length <= 8 ? `591${digitos}` : digitos;
  }
}

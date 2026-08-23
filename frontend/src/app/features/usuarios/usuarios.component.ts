import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ModalComponent } from '../../shared/modal/modal.component';
import { RolUsuario } from '../../shared/models/usuario.model';
import { Usuario, UsuarioForm, UsuariosService } from './usuarios.service';

const FORM_VACIO: UsuarioForm = { nombre: '', email: '', password: '', rol: 'EMPLEADA' };

@Component({
  selector: 'sd-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent],
  templateUrl: './usuarios.component.html',
})
export class UsuariosComponent implements OnInit {
  readonly usuarios = signal<Usuario[]>([]);
  readonly cargando = signal(true);
  readonly error = signal<string | null>(null);
  readonly modalAbierto = signal(false);
  readonly guardando = signal(false);
  readonly errorForm = signal<string | null>(null);

  form: UsuarioForm = { ...FORM_VACIO };

  constructor(private readonly usuariosService: UsuariosService) {}

  ngOnInit(): void {
    this.cargar();
  }

  private cargar(): void {
    this.cargando.set(true);
    this.usuariosService.listar().subscribe({
      next: (usuarios) => {
        this.usuarios.set(usuarios);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('No se pudo cargar los usuarios.');
        this.cargando.set(false);
      },
    });
  }

  abrirModal(): void {
    this.form = { ...FORM_VACIO };
    this.errorForm.set(null);
    this.modalAbierto.set(true);
  }

  guardar(): void {
    if (!this.form.nombre.trim() || !this.form.email.trim() || this.form.password.length < 6) {
      this.errorForm.set('Completa nombre, email y una contraseña de al menos 6 caracteres.');
      return;
    }

    this.guardando.set(true);
    this.usuariosService.crear(this.form).subscribe({
      next: () => {
        this.guardando.set(false);
        this.modalAbierto.set(false);
        this.cargar();
      },
      error: (err) => {
        this.guardando.set(false);
        this.errorForm.set(err.status === 409 ? 'Ya existe un usuario con ese email.' : 'No se pudo crear el usuario.');
      },
    });
  }

  toggleEstado(usuario: Usuario): void {
    this.usuariosService.cambiarEstado(usuario.id, !usuario.activo).subscribe(() => this.cargar());
  }

  etiquetaRol(rol: RolUsuario): string {
    return rol === 'ADMIN' ? 'Admin' : 'Empleada';
  }
}

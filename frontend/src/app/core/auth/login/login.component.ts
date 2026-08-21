import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
  selector: 'sd-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  email = '';
  password = '';
  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);

  constructor(
    private readonly auth: AuthService,
    private readonly router: Router,
  ) {}

  onSubmit(): void {
    this.error.set(null);
    this.cargando.set(true);

    this.auth.login(this.email, this.password).subscribe({
      next: () =>
        this.auth.cargarUsuarioActual().subscribe({
          next: (usuario) => {
            this.cargando.set(false);
            const destino = usuario.rol === 'DUENA' ? '/dashboard' : '/ventas';
            this.router.navigateByUrl(destino);
          },
          error: () => this.manejarError(),
        }),
      error: () => this.manejarError(),
    });
  }

  private manejarError(): void {
    this.cargando.set(false);
    this.error.set('Email o contraseña incorrectos.');
  }
}

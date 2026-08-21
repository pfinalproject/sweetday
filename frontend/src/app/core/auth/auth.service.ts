import { HttpClient } from '@angular/common/http';
import { Injectable, computed, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { UsuarioActual } from '../../shared/models/usuario.model';

const TOKEN_KEY = 'sweetday_token';

interface TokenResponse {
  access_token: string;
  token_type: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly usuarioSignal = signal<UsuarioActual | null>(null);

  readonly usuario = this.usuarioSignal.asReadonly();
  readonly esDuena = computed(() => this.usuarioSignal()?.rol === 'DUENA');
  readonly autenticado = computed(() => this.usuarioSignal() !== null);

  constructor(
    private readonly http: HttpClient,
    private readonly router: Router,
  ) {}

  get token(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  login(email: string, password: string): Observable<TokenResponse> {
    const body = new URLSearchParams();
    body.set('username', email);
    body.set('password', password);

    return this.http
      .post<TokenResponse>(`${environment.apiUrl}/auth/login`, body.toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      })
      .pipe(tap((res) => localStorage.setItem(TOKEN_KEY, res.access_token)));
  }

  cargarUsuarioActual(): Observable<UsuarioActual> {
    return this.http
      .get<UsuarioActual>(`${environment.apiUrl}/auth/me`)
      .pipe(tap((usuario) => this.usuarioSignal.set(usuario)));
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    this.usuarioSignal.set(null);
    this.router.navigateByUrl('/login');
  }
}

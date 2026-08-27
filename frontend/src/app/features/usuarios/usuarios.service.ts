import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { RolUsuario } from '../../shared/models/usuario.model';

export interface Usuario {
  id: string;
  nombre: string;
  email: string;
  rol: RolUsuario;
  activo: boolean;
}

export interface UsuarioForm {
  nombre: string;
  email: string;
  password: string;
  rol: RolUsuario;
}

export interface UsuarioActualizarForm {
  nombre: string;
  email: string;
  password?: string;
  rol: RolUsuario;
}

@Injectable({ providedIn: 'root' })
export class UsuariosService {
  private readonly base = `${environment.apiUrl}/usuarios`;

  constructor(private readonly http: HttpClient) {}

  listar(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(this.base);
  }

  crear(datos: UsuarioForm): Observable<Usuario> {
    return this.http.post<Usuario>(this.base, datos);
  }

  actualizar(id: string, datos: UsuarioActualizarForm): Observable<Usuario> {
    const payload: Partial<UsuarioActualizarForm> = { ...datos };
    if (!payload.password) {
      delete payload.password;
    }
    return this.http.put<Usuario>(`${this.base}/${id}`, payload);
  }

  cambiarEstado(id: string, activo: boolean): Observable<Usuario> {
    return this.http.patch<Usuario>(`${this.base}/${id}/estado`, null, { params: { activo } });
  }
}

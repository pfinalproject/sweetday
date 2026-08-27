import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Categoria } from '../../shared/models/producto.model';

@Injectable({ providedIn: 'root' })
export class CategoriasService {
  private readonly base = `${environment.apiUrl}/categorias`;

  constructor(private readonly http: HttpClient) {}

  listar(activo = true): Observable<Categoria[]> {
    return this.http.get<Categoria[]>(this.base, { params: { activo } });
  }

  crear(nombre: string): Observable<Categoria> {
    return this.http.post<Categoria>(this.base, { nombre });
  }

  actualizar(id: string, nombre: string): Observable<Categoria> {
    return this.http.put<Categoria>(`${this.base}/${id}`, { nombre });
  }

  cambiarEstado(id: string, activo: boolean): Observable<Categoria> {
    return this.http.patch<Categoria>(`${this.base}/${id}/estado`, null, { params: { activo } });
  }
}

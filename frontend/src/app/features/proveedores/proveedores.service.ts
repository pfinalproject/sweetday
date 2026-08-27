import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Proveedor } from '../../shared/models/producto.model';

export interface ProveedorForm {
  nombre: string;
  contacto: string | null;
  telefono: string | null;
}

@Injectable({ providedIn: 'root' })
export class ProveedoresService {
  private readonly base = `${environment.apiUrl}/proveedores`;

  constructor(private readonly http: HttpClient) {}

  listar(activo = true): Observable<Proveedor[]> {
    return this.http.get<Proveedor[]>(this.base, { params: { activo } });
  }

  crear(datos: ProveedorForm): Observable<Proveedor> {
    return this.http.post<Proveedor>(this.base, datos);
  }

  actualizar(id: string, datos: ProveedorForm): Observable<Proveedor> {
    return this.http.put<Proveedor>(`${this.base}/${id}`, datos);
  }

  cambiarEstado(id: string, activo: boolean): Observable<Proveedor> {
    return this.http.patch<Proveedor>(`${this.base}/${id}/estado`, null, { params: { activo } });
  }
}

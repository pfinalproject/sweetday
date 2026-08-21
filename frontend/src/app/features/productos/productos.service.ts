import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Producto } from '../../shared/models/producto.model';

export interface ProductoForm {
  nombre: string;
  codigo_barras: string | null;
  precio: number;
  costo: number;
  stock: number;
  categoria_id: string;
  proveedor_id: string;
  imagen_url: string | null;
}

@Injectable({ providedIn: 'root' })
export class ProductosService {
  private readonly base = `${environment.apiUrl}/productos`;

  constructor(private readonly http: HttpClient) {}

  listar(activo: boolean): Observable<Producto[]> {
    return this.http.get<Producto[]>(this.base, { params: { activo } });
  }

  buscarPorCodigo(codigoBarras: string): Observable<Producto | null> {
    return this.http
      .get<Producto>(`${this.base}/codigo/${codigoBarras}`)
      .pipe(catchError(() => of(null)));
  }

  crear(datos: ProductoForm): Observable<Producto> {
    return this.http.post<Producto>(this.base, datos);
  }

  actualizar(id: string, datos: ProductoForm): Observable<Producto> {
    return this.http.put<Producto>(`${this.base}/${id}`, datos);
  }

  desactivar(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}

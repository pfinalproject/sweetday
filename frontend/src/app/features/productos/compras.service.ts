import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Compra {
  id: string;
  producto_id: string;
  proveedor_id: string;
  usuario_id: string;
  cantidad: number;
  costo_unitario: string;
  total: string;
  creado_en: string;
}

@Injectable({ providedIn: 'root' })
export class ComprasService {
  private readonly base = `${environment.apiUrl}/compras`;

  constructor(private readonly http: HttpClient) {}

  registrar(productoId: string, cantidad: number, costoUnitario: number): Observable<Compra> {
    return this.http.post<Compra>(this.base, {
      producto_id: productoId,
      cantidad,
      costo_unitario: costoUnitario,
    });
  }
}

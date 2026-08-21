import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface VentaItem {
  producto_id: string;
  cantidad: number;
}

export interface VentaDetalle {
  producto_id: string;
  nombre_producto: string;
  cantidad: number;
  precio_unitario: string;
  costo_unitario: string;
}

export interface Venta {
  id: string;
  usuario_id: string;
  usuario_nombre: string;
  total: string;
  creado_en: string;
  detalles: VentaDetalle[];
}

@Injectable({ providedIn: 'root' })
export class VentasService {
  private readonly base = `${environment.apiUrl}/ventas`;

  constructor(private readonly http: HttpClient) {}

  crear(items: VentaItem[]): Observable<Venta> {
    return this.http.post<Venta>(this.base, { items });
  }

  listar(desde?: string, hasta?: string): Observable<Venta[]> {
    const params: Record<string, string> = {};
    if (desde) params['desde'] = desde;
    if (hasta) params['hasta'] = hasta;
    return this.http.get<Venta[]>(this.base, { params });
  }
}

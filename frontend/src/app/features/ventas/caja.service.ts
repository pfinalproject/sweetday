import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CompraHistorial } from '../productos/compras.service';
import { Venta } from './ventas.service';

export interface TurnoCaja {
  id: string;
  usuario_id: string;
  apertura_fecha: string;
  monto_apertura: string;
  cierre_fecha: string | null;
  monto_cierre: string | null;
  total_vendido: string | null;
}

export interface TurnoCajaHistorial {
  id: string;
  nombre_usuario: string;
  apertura_fecha: string;
  monto_apertura: string;
  cierre_fecha: string | null;
  monto_cierre: string | null;
}

export interface TurnoCajaDetalle {
  turno: TurnoCajaHistorial;
  ventas: Venta[];
  compras: CompraHistorial[];
  total_ingresos: string;
  total_egresos: string;
  ganancia_neta: string;
}

@Injectable({ providedIn: 'root' })
export class CajaService {
  private readonly base = `${environment.apiUrl}/turnos-caja`;

  constructor(private readonly http: HttpClient) {}

  actual(): Observable<TurnoCaja | null> {
    return this.http.get<TurnoCaja | null>(`${this.base}/actual`);
  }

  abrir(montoApertura: number): Observable<TurnoCaja> {
    return this.http.post<TurnoCaja>(`${this.base}/abrir`, { monto_apertura: montoApertura });
  }

  cerrar(turnoId: string, montoCierre: number): Observable<TurnoCaja> {
    return this.http.post<TurnoCaja>(`${this.base}/${turnoId}/cerrar`, { monto_cierre: montoCierre });
  }

  listar(desde?: string, hasta?: string): Observable<TurnoCajaHistorial[]> {
    const params: Record<string, string> = {};
    if (desde) params['desde'] = desde;
    if (hasta) params['hasta'] = hasta;
    return this.http.get<TurnoCajaHistorial[]>(this.base, { params });
  }

  detalle(turnoId: string): Observable<TurnoCajaDetalle> {
    return this.http.get<TurnoCajaDetalle>(`${this.base}/${turnoId}/detalle`);
  }
}

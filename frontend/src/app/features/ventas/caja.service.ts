import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface TurnoCaja {
  id: string;
  usuario_id: string;
  apertura_fecha: string;
  monto_apertura: string;
  cierre_fecha: string | null;
  monto_cierre: string | null;
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
}

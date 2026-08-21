import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ResumenFinanciero {
  ingresos: string;
  egresos: string;
  ganancia_neta: string;
  num_ventas: number;
  num_compras: number;
}

@Injectable({ providedIn: 'root' })
export class ReportesService {
  private readonly base = `${environment.apiUrl}/reportes`;

  constructor(private readonly http: HttpClient) {}

  resumen(desde?: string, hasta?: string): Observable<ResumenFinanciero> {
    const params: Record<string, string> = {};
    if (desde) params['desde'] = desde;
    if (hasta) params['hasta'] = hasta;
    return this.http.get<ResumenFinanciero>(`${this.base}/resumen`, { params });
  }
}

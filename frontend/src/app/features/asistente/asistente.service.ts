import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface RespuestaAsistente {
  respuesta: string;
}

@Injectable({ providedIn: 'root' })
export class AsistenteService {
  private readonly base = `${environment.apiUrl}/asistente`;

  constructor(private readonly http: HttpClient) {}

  preguntar(pregunta: string): Observable<RespuestaAsistente> {
    return this.http.post<RespuestaAsistente>(`${this.base}/preguntar`, { pregunta });
  }
}

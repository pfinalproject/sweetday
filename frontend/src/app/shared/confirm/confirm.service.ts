import { Injectable, signal } from '@angular/core';

interface ConfirmState {
  titulo: string;
  mensaje: string;
  textoConfirmar: string;
  resolve: (valor: boolean) => void;
}

@Injectable({ providedIn: 'root' })
export class ConfirmService {
  readonly estado = signal<ConfirmState | null>(null);

  /** Reemplazo del confirm() nativo del navegador: muestra el diálogo propio y resuelve con la respuesta del usuario. */
  pedir(mensaje: string, titulo = 'Confirmar', textoConfirmar = 'Aceptar'): Promise<boolean> {
    return new Promise((resolve) => {
      this.estado.set({ titulo, mensaje, textoConfirmar, resolve });
    });
  }

  responder(valor: boolean): void {
    this.estado()?.resolve(valor);
    this.estado.set(null);
  }
}

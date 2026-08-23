import { Component, inject } from '@angular/core';
import { ConfirmService } from './confirm.service';

@Component({
  selector: 'sd-confirm-dialog',
  standalone: true,
  template: `
    @if (confirmService.estado(); as estado) {
      <div class="modal-backdrop" (click)="confirmService.responder(false)">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-head">
            <h3>{{ estado.titulo }}</h3>
          </div>
          <p>{{ estado.mensaje }}</p>
          <div class="modal-actions">
            <button class="btn-outline" type="button" (click)="confirmService.responder(false)">Cancelar</button>
            <button class="btn-primary" type="button" (click)="confirmService.responder(true)">
              {{ estado.textoConfirmar }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class ConfirmDialogComponent {
  readonly confirmService = inject(ConfirmService);
}

import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'sd-modal',
  standalone: true,
  template: `
    <div class="modal-backdrop" (click)="cerrar.emit()">
      <div class="modal" (click)="$event.stopPropagation()">
        <div class="modal-head">
          <h3>{{ titulo }}</h3>
          <button type="button" (click)="cerrar.emit()" aria-label="Cerrar">×</button>
        </div>
        <ng-content></ng-content>
      </div>
    </div>
  `,
})
export class ModalComponent {
  @Input() titulo = '';
  @Output() cerrar = new EventEmitter<void>();
}

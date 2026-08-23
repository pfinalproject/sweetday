import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ConfirmDialogComponent } from './shared/confirm/confirm-dialog.component';

@Component({
  selector: 'sd-root',
  standalone: true,
  imports: [RouterOutlet, ConfirmDialogComponent],
  template: `<router-outlet></router-outlet><sd-confirm-dialog></sd-confirm-dialog>`,
})
export class AppComponent {}

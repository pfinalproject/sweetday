import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AlertasService } from '../../core/alertas/alertas.service';

@Component({
  selector: 'sd-alertas',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './alertas.component.html',
  styleUrl: './alertas.component.scss',
})
export class AlertasComponent {
  private readonly alertasService = inject(AlertasService);

  readonly cargado = this.alertasService.cargado;
  readonly sinStock = this.alertasService.sinStock;
  readonly stockBajo = this.alertasService.stockBajo;
  readonly sinAlertas = () => this.sinStock().length === 0 && this.stockBajo().length === 0;

  constructor() {
    this.alertasService.iniciar();
  }

  /** Deja solo dígitos y antepone el código de Bolivia (591) si el número no trae código de país. */
  telefonoNormalizado(telefono: string): string {
    const digitos = telefono.replace(/\D/g, '');
    return digitos.length <= 8 ? `591${digitos}` : digitos;
  }
}

import { CommonModule } from '@angular/common';
import { Component, ElementRef, ViewChild, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AsistenteService } from './asistente.service';

interface Mensaje {
  rol: 'usuario' | 'asistente';
  texto: string;
  esError?: boolean;
}

const SUGERENCIAS = [
  '¿Qué productos están por agotarse?',
  '¿Qué se vendió más este mes?',
  '¿Cuánto llevamos de ingresos hoy?',
  '¿Cuánto stock queda de Coca Cola?',
];

@Component({
  selector: 'sd-asistente',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './asistente.component.html',
  styleUrl: './asistente.component.scss',
})
export class AsistenteComponent {
  private readonly asistenteService = inject(AsistenteService);

  @ViewChild('scrollAnchor') private scrollAnchor?: ElementRef<HTMLDivElement>;

  readonly sugerencias = SUGERENCIAS;
  readonly mensajes = signal<Mensaje[]>([]);
  readonly enviando = signal(false);

  pregunta = '';

  preguntar(texto?: string): void {
    const contenido = (texto ?? this.pregunta).trim();
    if (!contenido || this.enviando()) {
      return;
    }

    this.mensajes.update((actual) => [...actual, { rol: 'usuario', texto: contenido }]);
    this.pregunta = '';
    this.enviando.set(true);
    this.desplazarAlFinal();

    this.asistenteService.preguntar(contenido).subscribe({
      next: (respuesta) => {
        this.mensajes.update((actual) => [...actual, { rol: 'asistente', texto: respuesta.respuesta }]);
        this.enviando.set(false);
        this.desplazarAlFinal();
      },
      error: (err) => {
        const detalle = err.error?.detail ?? 'No se pudo consultar al asistente. Intenta de nuevo.';
        this.mensajes.update((actual) => [...actual, { rol: 'asistente', texto: detalle, esError: true }]);
        this.enviando.set(false);
        this.desplazarAlFinal();
      },
    });
  }

  private desplazarAlFinal(): void {
    setTimeout(() => this.scrollAnchor?.nativeElement.scrollIntoView({ behavior: 'smooth' }));
  }
}

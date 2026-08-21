import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'sd-placeholder',
  standalone: true,
  template: `
    <div class="placeholder">
      <h2>{{ titulo }}</h2>
      <p>{{ descripcion }}</p>
    </div>
  `,
  styles: [
    `
      .placeholder {
        border: 1px dashed var(--border);
        border-radius: var(--radius);
        padding: 40px;
        color: var(--text-muted);
      }
      h2 {
        color: var(--text);
        font-size: 20px;
        margin-bottom: 8px;
      }
      p {
        margin: 0;
        font-size: 13.5px;
      }
    `,
  ],
})
export class PlaceholderComponent {
  private readonly route = inject(ActivatedRoute);

  readonly titulo: string = this.route.snapshot.data['title'] ?? 'Módulo';
  readonly descripcion: string =
    this.route.snapshot.data['description'] ?? 'Este módulo se implementa en una fase posterior del roadmap.';
}

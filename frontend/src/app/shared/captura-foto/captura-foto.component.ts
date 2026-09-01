import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, EventEmitter, OnDestroy, Output, ViewChild, signal } from '@angular/core';

/** Vista previa de cámara en vivo + botón para capturar una foto fija.
 * En celulares el atributo `capture` de un input file ya abre la cámara directo, pero los
 * navegadores de escritorio lo ignoran y solo abren el explorador de archivos — por eso acá se
 * pide la cámara con getUserMedia (funciona igual en PC con webcam) en vez de depender de eso. */
@Component({
  selector: 'sd-captura-foto',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './captura-foto.component.html',
  styleUrl: './captura-foto.component.scss',
})
export class CapturaFotoComponent implements AfterViewInit, OnDestroy {
  @Output() fotoCapturada = new EventEmitter<File>();

  @ViewChild('video') videoRef!: ElementRef<HTMLVideoElement>;

  readonly error = signal<string | null>(null);
  readonly listo = signal(false);

  private stream: MediaStream | null = null;

  async ngAfterViewInit(): Promise<void> {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      });
      this.videoRef.nativeElement.srcObject = this.stream;
      await this.videoRef.nativeElement.play();
      this.listo.set(true);
    } catch {
      this.error.set('No se pudo acceder a la cámara. Revisa los permisos del navegador e intenta de nuevo.');
    }
  }

  capturar(): void {
    const video = this.videoRef.nativeElement;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')?.drawImage(video, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          return;
        }
        this.fotoCapturada.emit(new File([blob], 'captura.jpg', { type: 'image/jpeg' }));
      },
      'image/jpeg',
      0.9,
    );
  }

  ngOnDestroy(): void {
    this.stream?.getTracks().forEach((track) => track.stop());
  }
}

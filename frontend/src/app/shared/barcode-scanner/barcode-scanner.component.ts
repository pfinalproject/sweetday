import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnDestroy, Output, ViewChild, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { BarcodeFormat, DecodeHintType } from '@zxing/library';

/** Solo los formatos de código de barras que realmente usan los productos de la tienda
 * (EAN/UPC/Code128/Code39) — evita que el lector intente decodificar QR/PDF417/Aztec/
 * DataMatrix/MaxiCode en cada frame, que no son formatos relevantes para retail y son
 * la fuente principal del spam de "NotFoundException" en consola durante el escaneo. */
const HINTS = new Map([
  [
    DecodeHintType.POSSIBLE_FORMATS,
    [
      BarcodeFormat.EAN_13,
      BarcodeFormat.EAN_8,
      BarcodeFormat.UPC_A,
      BarcodeFormat.UPC_E,
      BarcodeFormat.CODE_128,
      BarcodeFormat.CODE_39,
    ],
  ],
]);

@Component({
  selector: 'sd-barcode-scanner',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './barcode-scanner.component.html',
  styleUrl: './barcode-scanner.component.scss',
})
export class BarcodeScannerComponent implements AfterViewInit, OnDestroy {
  /** Si es true, sigue escaneando tras cada deteccion (util en Ventas). Si es false, se cierra solo (util en Productos). */
  @Input() continuo = false;
  @Output() codigoDetectado = new EventEmitter<string>();
  @Output() cerrar = new EventEmitter<void>();

  @ViewChild('video') videoRef!: ElementRef<HTMLVideoElement>;

  readonly error = signal<string | null>(null);
  readonly listo = signal(false);
  readonly tieneLinterna = signal(false);
  readonly linternaActiva = signal(false);
  codigoManual = '';

  private lector: BrowserMultiFormatReader | null = null;
  private controles: { stop: () => void } | null = null;
  private pistaVideo: MediaStreamTrack | null = null;
  private ultimaDeteccion = '';
  private ultimaDeteccionEn = 0;

  ngAfterViewInit(): void {
    this.iniciar();
  }

  private async iniciar(): Promise<void> {
    try {
      this.lector = new BrowserMultiFormatReader(HINTS);
      const dispositivos = await BrowserMultiFormatReader.listVideoInputDevices();
      if (dispositivos.length === 0) {
        this.error.set('No se encontró ninguna cámara en este dispositivo.');
        return;
      }
      const trasera = dispositivos.find((d) => /back|trasera|rear|environment/i.test(d.label));
      const deviceId = (trasera ?? dispositivos[dispositivos.length - 1]).deviceId;

      const controles = await this.lector.decodeFromVideoDevice(deviceId, this.videoRef.nativeElement, (resultado) => {
        if (!resultado) {
          return;
        }
        const texto = resultado.getText();
        const ahora = Date.now();
        if (texto === this.ultimaDeteccion && ahora - this.ultimaDeteccionEn < 2000) {
          return;
        }
        this.ultimaDeteccion = texto;
        this.ultimaDeteccionEn = ahora;
        this.onDetectado(texto);
      });
      this.controles = controles;
      this.listo.set(true);

      const stream = this.videoRef.nativeElement.srcObject as MediaStream | null;
      this.pistaVideo = stream?.getVideoTracks()[0] ?? null;
      const capacidades = this.pistaVideo?.getCapabilities?.() as (MediaTrackCapabilities & { torch?: boolean }) | undefined;
      this.tieneLinterna.set(!!capacidades?.torch);
    } catch (err) {
      this.error.set('No se pudo acceder a la cámara. Puedes escribir el código manualmente abajo.');
    }
  }

  private onDetectado(codigo: string): void {
    if (navigator.vibrate) {
      navigator.vibrate(80);
    }
    this.codigoDetectado.emit(codigo);
    if (!this.continuo) {
      this.cerrar.emit();
    }
  }

  async alternarLinterna(): Promise<void> {
    if (!this.pistaVideo) {
      return;
    }
    const nuevoEstado = !this.linternaActiva();
    try {
      await this.pistaVideo.applyConstraints({ advanced: [{ torch: nuevoEstado } as MediaTrackConstraintSet] });
      this.linternaActiva.set(nuevoEstado);
    } catch {
      // Algunos dispositivos anuncian soporte de torch pero no lo aplican; se ignora.
    }
  }

  confirmarManual(): void {
    const codigo = this.codigoManual.trim();
    if (!codigo) {
      return;
    }
    this.onDetectado(codigo);
    this.codigoManual = '';
  }

  ngOnDestroy(): void {
    this.controles?.stop();
  }
}

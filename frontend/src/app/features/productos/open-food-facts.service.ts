import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, map, of } from 'rxjs';

export interface ProductoExterno {
  nombre: string;
  imagenUrl: string | null;
}

interface OpenFoodFactsRespuesta {
  status: number;
  product?: {
    product_name?: string;
    brands?: string;
    image_front_small_url?: string;
    quantity?: string;
  };
}

/**
 * Open Food Facts (world.openfoodfacts.org): base de datos pública y gratuita de
 * productos por código de barras, sin API key. Cubre bien snacks/bebidas; para
 * productos que no son alimentos (maletas, candados) normalmente no encuentra nada
 * y el formulario se completa a mano — es un atajo, no una fuente obligatoria.
 */
@Injectable({ providedIn: 'root' })
export class OpenFoodFactsService {
  constructor(private readonly http: HttpClient) {}

  buscarPorCodigo(codigoBarras: string): Observable<ProductoExterno | null> {
    const url = `https://world.openfoodfacts.org/api/v2/product/${codigoBarras}.json?fields=product_name,brands,image_front_small_url,quantity`;
    return this.http.get<OpenFoodFactsRespuesta>(url).pipe(
      map((respuesta) => {
        const producto = respuesta.product;
        if (respuesta.status !== 1 || !producto?.product_name) {
          return null;
        }

        let nombre = producto.product_name;

        // Solo agrega la marca si aporta algo — muchos productos ya la traen en el nombre.
        const marcaPrincipal = producto.brands?.split(',')[0]?.trim();
        if (marcaPrincipal && !nombre.toLowerCase().includes(marcaPrincipal.toLowerCase())) {
          nombre += ` (${marcaPrincipal})`;
        }

        // Cantidad/tamaño (ej. "500 ml", "180g") — casi nunca falta y ayuda a distinguir variantes.
        if (producto.quantity) {
          nombre += ` — ${producto.quantity}`;
        }

        return { nombre, imagenUrl: producto.image_front_small_url ?? null };
      }),
      catchError(() => of(null)),
    );
  }
}

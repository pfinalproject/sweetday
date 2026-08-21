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
    const url = `https://world.openfoodfacts.org/api/v2/product/${codigoBarras}.json?fields=product_name,brands,image_front_small_url`;
    return this.http.get<OpenFoodFactsRespuesta>(url).pipe(
      map((respuesta) => {
        if (respuesta.status !== 1 || !respuesta.product?.product_name) {
          return null;
        }
        const nombre = respuesta.product.brands
          ? `${respuesta.product.product_name} (${respuesta.product.brands})`
          : respuesta.product.product_name;
        return { nombre, imagenUrl: respuesta.product.image_front_small_url ?? null };
      }),
      catchError(() => of(null)),
    );
  }
}

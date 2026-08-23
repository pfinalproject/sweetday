/** Reglas de validación de campos de texto, espejo de backend/app/schemas/validadores.py. */

const NOMBRE_PATTERN = /^[\w\sÀ-ÿ.,&'()/-]+$/u;
const TELEFONO_PATTERN = /^[\d\s()+-]+$/;

export function nombreValido(valor: string | null | undefined): boolean {
  const v = (valor ?? '').trim();
  return v.length > 0 && v.length <= 120 && NOMBRE_PATTERN.test(v);
}

/** Igual que nombreValido() pero acepta vacío/null, para campos opcionales. */
export function nombreOpcionalValido(valor: string | null | undefined): boolean {
  const v = (valor ?? '').trim();
  return v.length === 0 || nombreValido(v);
}

export function telefonoValido(valor: string | null | undefined): boolean {
  const v = (valor ?? '').trim();
  return v.length === 0 || (v.length <= 30 && TELEFONO_PATTERN.test(v));
}

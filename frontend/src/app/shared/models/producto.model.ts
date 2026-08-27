export interface Categoria {
  id: string;
  nombre: string;
  activo: boolean;
}

export interface Proveedor {
  id: string;
  nombre: string;
  contacto: string | null;
  telefono: string | null;
  activo: boolean;
}

export interface Producto {
  id: string;
  nombre: string;
  codigo_barras: string | null;
  precio: string;
  costo: string;
  stock: number;
  activo: boolean;
  imagen_url: string | null;
  tiene_foto: boolean;
  creado_en: string;
  categoria: Categoria;
  proveedor: Proveedor;
}

export interface ProductoReconocido {
  producto: Producto;
  similitud_pct: number;
}

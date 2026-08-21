export type RolUsuario = 'DUENA' | 'EMPLEADA';

export interface UsuarioActual {
  id: string;
  nombre: string;
  email: string;
  rol: RolUsuario;
}

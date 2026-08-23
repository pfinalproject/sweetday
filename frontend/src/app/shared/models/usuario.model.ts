export type RolUsuario = 'ADMIN' | 'EMPLEADA';

export interface UsuarioActual {
  id: string;
  nombre: string;
  email: string;
  rol: RolUsuario;
}

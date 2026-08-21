import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { RolUsuario } from '../../shared/models/usuario.model';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.autenticado()) {
    return true;
  }

  if (!auth.token) {
    return router.createUrlTree(['/login']);
  }

  return auth.cargarUsuarioActual().pipe(
    map(() => true),
    catchError(() => of(router.createUrlTree(['/login']))),
  );
};

export function rolGuard(...rolesPermitidos: RolUsuario[]): CanActivateFn {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);
    const rol = auth.usuario()?.rol;

    if (rol && rolesPermitidos.includes(rol)) {
      return true;
    }
    return router.createUrlTree(['/ventas']);
  };
}

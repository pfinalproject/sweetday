import { Routes } from '@angular/router';
import { authGuard, rolGuard } from './core/auth/auth.guard';
import { LoginComponent } from './core/auth/login/login.component';
import { ShellComponent } from './core/layout/shell.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: '',
    component: ShellComponent,
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        canActivate: [rolGuard('ADMIN')],
        loadComponent: () => import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
      },
      {
        path: 'categorias',
        canActivate: [rolGuard('ADMIN')],
        loadComponent: () => import('./features/categorias/categorias.component').then((m) => m.CategoriasComponent),
      },
      { path: 'productos', canActivate: [rolGuard('ADMIN')], loadComponent: () => import('./features/productos/productos.component').then((m) => m.ProductosComponent) },
      {
        path: 'proveedores',
        canActivate: [rolGuard('ADMIN')],
        loadComponent: () => import('./features/proveedores/proveedores.component').then((m) => m.ProveedoresComponent),
      },
      {
        path: 'ventas',
        loadComponent: () => import('./features/ventas/ventas.component').then((m) => m.VentasComponent),
      },
      {
        path: 'historial-ventas',
        canActivate: [rolGuard('ADMIN')],
        loadComponent: () =>
          import('./features/historial-ventas/historial-ventas.component').then((m) => m.HistorialVentasComponent),
      },
      {
        path: 'alertas',
        canActivate: [rolGuard('ADMIN')],
        loadComponent: () => import('./features/alertas/alertas.component').then((m) => m.AlertasComponent),
      },
      {
        path: 'usuarios',
        canActivate: [rolGuard('ADMIN')],
        loadComponent: () => import('./features/usuarios/usuarios.component').then((m) => m.UsuariosComponent),
      },
      {
        path: 'reportes',
        canActivate: [rolGuard('ADMIN')],
        loadComponent: () => import('./features/reportes/reportes.component').then((m) => m.ReportesComponent),
      },
      {
        path: 'asistente',
        canActivate: [rolGuard('ADMIN')],
        loadComponent: () => import('./features/asistente/asistente.component').then((m) => m.AsistenteComponent),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];

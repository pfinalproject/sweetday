import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { AlertasService } from '../alertas/alertas.service';
import { RolUsuario } from '../../shared/models/usuario.model';

interface NavItem {
  path: string;
  label: string;
  icon: string;
  roles: RolUsuario[];
}

const NAV_ITEMS: NavItem[] = [
  { path: '/dashboard', label: 'Dashboard', icon: 'grid', roles: ['ADMIN'] },
  { path: '/categorias', label: 'Categorías', icon: 'tag', roles: ['ADMIN'] },
  { path: '/productos', label: 'Productos', icon: 'box', roles: ['ADMIN'] },
  { path: '/proveedores', label: 'Proveedores', icon: 'truck', roles: ['ADMIN'] },
  { path: '/ventas', label: 'Ventas', icon: 'cart', roles: ['ADMIN', 'EMPLEADA'] },
  { path: '/historial-ventas', label: 'Historial de Ventas', icon: 'clock', roles: ['ADMIN'] },
  { path: '/alertas', label: 'Alertas', icon: 'bell', roles: ['ADMIN'] },
  { path: '/usuarios', label: 'Usuarios', icon: 'user', roles: ['ADMIN'] },
  { path: '/reportes', label: 'Reportes', icon: 'chart', roles: ['ADMIN'] },
  { path: '/asistente', label: 'Asistente', icon: 'chat', roles: ['ADMIN'] },
];

@Component({
  selector: 'sd-shell',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.scss',
})
export class ShellComponent {
  private readonly auth = inject(AuthService);
  private readonly alertasService = inject(AlertasService);

  readonly usuario = this.auth.usuario;
  readonly esAdmin = this.auth.esAdmin;
  readonly menuAbierto = signal(false);
  readonly panelAlertasAbierto = signal(false);

  readonly alertasCriticas = this.alertasService.criticos;
  readonly totalAlertas = this.alertasService.total;

  constructor() {
    if (this.auth.esAdmin()) {
      this.alertasService.iniciar();
    }
  }

  readonly navItems = computed(() => {
    const rol = this.auth.usuario()?.rol;
    return NAV_ITEMS.filter((item) => (rol ? item.roles.includes(rol) : false));
  });

  readonly iniciales = computed(() => {
    const nombre = this.auth.usuario()?.nombre ?? '';
    return nombre
      .split(' ')
      .slice(0, 2)
      .map((parte) => parte[0]?.toUpperCase() ?? '')
      .join('');
  });

  cerrarSesion(): void {
    this.auth.logout();
  }

  alternarMenu(): void {
    this.menuAbierto.update((abierto) => !abierto);
  }

  cerrarMenu(): void {
    this.menuAbierto.set(false);
  }

  alternarPanelAlertas(): void {
    this.panelAlertasAbierto.update((abierto) => !abierto);
  }

  cerrarPanelAlertas(): void {
    this.panelAlertasAbierto.set(false);
  }
}

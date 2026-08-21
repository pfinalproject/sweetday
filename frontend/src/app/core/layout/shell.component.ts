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
  { path: '/dashboard', label: 'Dashboard', icon: 'grid', roles: ['DUENA'] },
  { path: '/categorias', label: 'Categorías', icon: 'tag', roles: ['DUENA'] },
  { path: '/productos', label: 'Productos', icon: 'box', roles: ['DUENA'] },
  { path: '/proveedores', label: 'Proveedores', icon: 'truck', roles: ['DUENA'] },
  { path: '/ventas', label: 'Ventas', icon: 'cart', roles: ['DUENA', 'EMPLEADA'] },
  { path: '/historial-ventas', label: 'Historial de Ventas', icon: 'clock', roles: ['DUENA'] },
  { path: '/alertas', label: 'Alertas', icon: 'bell', roles: ['DUENA'] },
  { path: '/usuarios', label: 'Usuarios', icon: 'user', roles: ['DUENA'] },
  { path: '/reportes', label: 'Reportes', icon: 'chart', roles: ['DUENA'] },
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
  readonly esDuena = this.auth.esDuena;
  readonly menuAbierto = signal(false);
  readonly panelAlertasAbierto = signal(false);

  readonly alertasCriticas = this.alertasService.criticos;
  readonly totalAlertas = this.alertasService.total;

  constructor() {
    if (this.auth.esDuena()) {
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

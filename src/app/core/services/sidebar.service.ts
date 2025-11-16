import { Injectable } from '@angular/core';
import { SidebarItem } from '../interfaces/sidebar-item';
import { BehaviorSubject } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class SidebarService {
  private itemsSubject = new BehaviorSubject<SidebarItem[]>([]);
  items$ = this.itemsSubject.asObservable();

  constructor(private authService: AuthService) {}

  generateMenu() {
    const userId = Number(localStorage.getItem('userId'));
    if (!userId) {
      this.itemsSubject.next([]);
      return;
    }

    this.authService.getUserById(userId).subscribe({
      next: (user) => {
        const role = user.roles[0] || ''; // Ej: "ROLE_REPRESENTANTE"

        const baseRoute = role === 'ROLE_REPRESENTANTE' ? '/representante' : '/miembro';

        let items: SidebarItem[] = [];

        if (role === 'ROLE_REPRESENTANTE') {
          items = [
            { label: 'Home', icon: 'pi pi-home', route: `${baseRoute}/home` },
            { label: 'Agregar Hogar', icon: 'pi pi-plus-circle', route: `${baseRoute}/add` },
            { label: 'Miembros', icon: 'pi pi-users', route: `${baseRoute}/members` },
            { label: 'Cuentas', icon: 'pi pi-file', route: `${baseRoute}/bills` },
            { label: 'Contribuciones', icon: 'pi pi-dollar', route: `${baseRoute}/contributions` },
            { label: 'Ajustes', icon: 'pi pi-cog', route: `${baseRoute}/settings` }
          ];
        } else {
          items = [
            { label: 'Home', icon: 'pi pi-home', route: `${baseRoute}/home` },
            { label: 'Contribuciones', icon: 'pi pi-dollar', route: `${baseRoute}/contributions` },
            { label: 'Estado', icon: 'pi pi-chart-line', route: `${baseRoute}/status` },
            { label: 'Ajustes', icon: 'pi pi-cog', route: `${baseRoute}/settings` }
          ];
        }

        this.itemsSubject.next(items);
      },
      error: (err) => {
        console.error('Error cargando usuario para generar menú:', err);
        this.itemsSubject.next([]);
      }
    });
  }

  getMenu(): SidebarItem[] {
    return this.itemsSubject.value;
  }

  clearMenu() {
    this.itemsSubject.next([]);
  }
}

import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { Household } from '../../interfaces/household';
import { HouseholdService } from '../../services/household.service';
import { environment } from '../../../../core/environments/environment';

@Component({
  selector: 'app-home',
  standalone: false,
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {

  household: Household | null = null;
  members: any[] = [];
  bills: any[] = [];
  contributions: any[] = [];

  constructor(
    private householdService: HouseholdService,
    private http: HttpClient
  ) {}

  ngOnInit() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser')!);
    if (!currentUser || !currentUser.id) return;

    // Obtenemos los hogares del usuario activo
  this.householdService.getHouseholdsByUserId(currentUser.id).subscribe({
  next: hogares => {
    // Filtrar solo los hogares del usuario (si backend no hace el filtrado)
    const hogaresUsuario = hogares.filter(h => h.representanteId === currentUser.id);

    if (hogaresUsuario.length === 0) return;

    const firstHousehold = hogaresUsuario[0];
    this.household = firstHousehold;
    this.cargarDetalles(firstHousehold.id);
  },
  error: err => console.error("Error obteniendo hogares del usuario:", err)
});

  }

  // Cargar miembros, cuentas y contribuciones
  private cargarDetalles(householdId: number) {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
    });

    // Miembros
    this.http.get<any[]>(`${environment.urlBackend}/household-members`, { headers })
      .subscribe(allMembers => {
        this.members = allMembers.filter(m => m.householdId === householdId);
      });

    // Bills
    this.http.get<any[]>(`${environment.urlBackend}/bills`, { headers })
      .subscribe(allBills => {
        this.bills = allBills.filter(b => b.householdId === householdId);
      });

    // Contributions
    this.http.get<any[]>(`${environment.urlBackend}/contributions`, { headers })
      .subscribe(allContributions => {
        this.contributions = allContributions.filter(c => c.householdId === householdId);
      });
  }

}

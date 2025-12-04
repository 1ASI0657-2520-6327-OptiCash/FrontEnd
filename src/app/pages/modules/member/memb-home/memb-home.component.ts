import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { switchMap, forkJoin, of } from 'rxjs';
import { environment } from '../../../../core/environments/environment';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { AvatarModule } from 'primeng/avatar';
import { TagModule } from 'primeng/tag';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

interface User {
  id: number;
  username: string;
  email: string;
  income: number;
  roles: string[];
}

interface Household {
  id: number;
  name: string;
  description: string;
  currency: string;
  representanteId: number;
}

interface HouseholdMember {
  id: number;
  userId: number;
  householdId: number;
}

interface MemberContribution {
  id: number;
  contributionId: number;
  memberId: number;
  monto: number;
  status: 'PENDIENTE' | 'PAGADO';
  pagadoEn: string | null;
}

@Component({
  selector: 'app-memb-home',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    AvatarModule,
    TagModule,
    ProgressSpinnerModule,
  ],
  templateUrl: './memb-home.component.html',
  styleUrls: ['./memb-home.component.css']
})
export class MembHomeComponent implements OnInit {

  currentUser!: User;
  household: Household | null = null;
  members: User[] = [];
  contributions: MemberContribution[] = [];
  totalPendiente = 0;
  totalPagado = 0;
  loading = true;

  private readonly API_URL = `${environment.urlBackend}`;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    const userString = localStorage.getItem('currentUser');

    if (userString) {
      this.currentUser = JSON.parse(userString);
      this.loadDashboardData();
    } else {
      console.error("No se encontró usuario en la sesión.");
      this.loading = false;
    }
  }

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('accessToken');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  loadDashboardData(): void {
    this.loading = true;
    const headers = this.getAuthHeaders();

    this.http.get<HouseholdMember[]>(`${this.API_URL}/household-members`, { headers }).pipe(

      switchMap(allMemberships => {
        const myMembership = allMemberships.find(m => m.userId === this.currentUser.id);

        if (!myMembership) {
          console.log("El usuario no pertenece a ningún hogar.");
          return of(null);
        }

        const householdId = myMembership.householdId;

        return forkJoin({
          household: this.http.get<Household>(`${this.API_URL}/households/${householdId}`, { headers }),
          allUsers: this.http.get<User[]>(`${this.API_URL}/users`, { headers }),
          allMemberContributions: this.http.get<MemberContribution[]>(
            `${this.API_URL}/member-contributions?member_id=${this.currentUser.id}`,
            { headers }
          ),
          allMemberships: of(allMemberships)
        });
      })
    )
    .subscribe({
      next: (result) => {
        if (result) {
          const { household, allUsers, allMemberContributions, allMemberships } = result;

          this.household = household;

          const memberIdsOfMyHousehold = allMemberships
            .filter(m => m.householdId === this.household!.id)
            .map(m => m.userId);

          this.members = allUsers.filter(u => memberIdsOfMyHousehold.includes(u.id));

          this.contributions = allMemberContributions;

          this.totalPendiente = this.contributions
            .filter(c => c.status === 'PENDIENTE')
            .reduce((sum, c) => sum + (Number(c.monto) || 0), 0);

          this.totalPagado = this.contributions
            .filter(c => c.status === 'PAGADO')
            .reduce((sum, c) => sum + (Number(c.monto) || 0), 0);
        }

        this.loading = false;
      },
      error: (err) => {
        console.error("Error al cargar el dashboard", err);
        this.loading = false;
      }
    });
  }
}

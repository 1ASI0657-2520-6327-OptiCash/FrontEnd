import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { switchMap, map, forkJoin, of, tap } from 'rxjs';
import { ConfirmationService, MessageService } from 'primeng/api';
import { TranslateModule } from '@ngx-translate/core';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { DialogModule } from 'primeng/dialog';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { AvatarModule } from 'primeng/avatar';
import { TooltipModule } from 'primeng/tooltip';
import { environment } from '../../../../core/environments/environment';
import { HouseholdMemberService } from '../../services/household-member.service';
import { HouseholdMember } from '../../interfaces/household-member';
import { User } from '../../../../core/interfaces/auth';

@Component({
  selector: 'app-members',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslateModule,
    ToastModule,
    ConfirmDialogModule,
    ButtonModule,
    CardModule,
    InputTextModule,
    DialogModule,
    ProgressSpinnerModule,
    AvatarModule,
    TooltipModule
  ],
  templateUrl: './members.component.html',
  styleUrls: ['./members.component.css'],
  providers: [ConfirmationService, MessageService]
})

export class MembersComponent implements OnInit {
  members: User[] = [];
  loading = true;
  isSaving = false;
  showAddMemberForm = false;

  addMemberForm: FormGroup;

  householdId!: number;
  householdMembersLinks: HouseholdMember[] = [];
  hogaresDelUsuario: any[] = [];

private readonly API_URL = 'http://localhost:8080/api/v1';

  constructor(
    private http: HttpClient,
    private fb: FormBuilder,
    private confirmationService: ConfirmationService,
    private messageService: MessageService,
    private householdMemberService: HouseholdMemberService
  ) {
    this.addMemberForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      householdId: [null, Validators.required]
    });
  }

  ngOnInit(): void {
    this.cargarHogaresDelUsuario();
  }

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('accessToken');
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  // Carga hogares del usuario
  cargarHogaresDelUsuario() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser')!);

    this.http.get<any[]>(`${this.API_URL}/households?representanteId=${currentUser.id}`, {
      headers: this.getAuthHeaders()
    }).subscribe({
      next: hogares => {
//        console.log("🏠 Hogares del usuario:", hogares);
        this.hogaresDelUsuario = hogares;

        if (hogares.length > 0) {
          this.householdId = hogares[0].id; // Guardar el hogar activo
          this.loadMembers(this.householdId); // Cargar miembros
        }
      },
      error: err => console.error("Error obteniendo hogares:", err)
    });
  }

  // Cargar miembros de un hogar
  loadMembers(householdId: number) {
    this.loading = true;

    this.http.get<HouseholdMember[]>(`${this.API_URL}/household-members/${householdId}/members`, {
      headers: this.getAuthHeaders()
    }).pipe(
      switchMap(memberLinks => {
        this.householdMembersLinks = memberLinks || []; // Guardar links
        if (!memberLinks || memberLinks.length === 0) return of([]);
        const userIds = memberLinks.map(m => m.userId);

        // Traer datos de los usuarios
        const userRequests = userIds.map(id =>
          this.http.get<User>(`${this.API_URL}/users/${id}`, { headers: this.getAuthHeaders() })
        );
        return forkJoin(userRequests);
      })
    ).subscribe({
      next: users => {
        this.members = users;
        this.loading = false;
      },
      error: err => {
        console.error('❌ Error al cargar miembros:', err);
        this.members = [];
        this.loading = false;
      }
    });
  }

  // Eliminar miembro
  deleteMember(memberToDelete: User) {
    const linkToDelete = this.householdMembersLinks.find(link => link.userId === memberToDelete.id);
    if (!linkToDelete) return;

    this.confirmationService.confirm({
      message: `¿Seguro que quieres eliminar a ${memberToDelete.username}?`,
      header: 'Confirmar eliminación',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.householdMemberService.deleteMemberLink(linkToDelete.id).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Miembro eliminado.' });
            this.loadMembers(this.householdId); // recarga la lista
          },
          error: () => {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar el miembro.' });
          }
        });
      }
    });
  }

  // Abrir diálogo para añadir miembro
  openAddMemberDialog() {
    this.showAddMemberForm = true;
    if (this.hogaresDelUsuario.length === 1) {
      this.addMemberForm.patchValue({ householdId: this.hogaresDelUsuario[0].id });
    } else {
      this.addMemberForm.patchValue({ householdId: null });
    }
  }

  // Añadir miembro
  addMember() {
    if (this.addMemberForm.invalid) return;

    this.isSaving = true;
    const { email, householdId } = this.addMemberForm.value;

    this.http.get<User[]>(`${this.API_URL}/users?email=${email}`, { headers: this.getAuthHeaders() })
      .subscribe({
        next: users => {
          const userToAdd = users.find(u => u.email.toLowerCase().trim() === email.toLowerCase().trim());

          if (!userToAdd) {
            this.messageService.add({ severity: 'warn', summary: 'No encontrado', detail: 'No se encontró un usuario con ese email.' });
            this.isSaving = false;
            return;
          }

          const newMember = { userId: userToAdd.id, householdId };
          this.householdMemberService.createMemberLink(newMember).subscribe({
            next: () => {
              this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Miembro añadido.' });
              this.showAddMemberForm = false;
              this.isSaving = false;
              this.loadMembers(householdId); // recarga la lista
            },
            error: () => {
              this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo añadir el miembro.' });
              this.isSaving = false;
            }
          });
        },
        error: err => {
          console.error(err);
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al buscar el usuario.' });
          this.isSaving = false;
        }
      });
  }
}

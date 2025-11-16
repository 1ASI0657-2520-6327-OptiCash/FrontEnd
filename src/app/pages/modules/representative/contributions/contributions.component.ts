import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { ContributionsService } from '../../services/contributions.service';
import { environment } from '../../../../core/environments/environment';
import { Contribution, CreateContributionRequest } from '../../interfaces/contributions';
import { User } from '../../../../core/interfaces/auth';
import { AuthService } from '../../../../core/services/auth.service';
import { HouseholdService } from '../../services/household.service';
import { HouseholdMemberService } from '../../services/household-member.service';
import { BillsService } from '../../services/bills.service';
import { MemberContributionService } from '../../services/member-contribution.service';
import {  CreateContributionResource } from '../../interfaces/member-contribution';

@Component({
  selector: 'app-contributions',
  standalone: false,
  templateUrl: './contributions.component.html',
  styleUrl: './contributions.component.css'
})
export class ContributionsComponent implements OnInit {
    households: any[] = [];  // <<--- AGREGAR ESTA LÍNEA
  householdId = 0;
  contributions: any[] = [];
  bills: any[] = [];
  members: any[] = [];
  miembros: any[] = []; // Para el multiSelect
  currentUser!: User;
  loading = true;
  showForm = false;
  mostrarDialogo = false; // Para el dialog
  contributionForm!: FormGroup;

  // Opciones para el dropdown de estrategias
  estrategias = [
    { label: 'Igualitaria', value: 'EQUAL' },
    { label: 'Según Ingresos', value: 'INCOME_BASED' }
  ];

  constructor(
    private http: HttpClient,
    private fb: FormBuilder,
    private contributionsService: ContributionsService,
    private householdService: HouseholdService,
    private householdMemberService: HouseholdMemberService,
    private authService: AuthService,
    private billService: BillsService,
    private memberContributionService: MemberContributionService
  ) { }

ngOnInit(): void {
  this.currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');

  this.contributionForm = this.fb.group({
    billId: [null, Validators.required],         // Factura
    householdId: [null, Validators.required],    // Hogar
    description: ['', Validators.required],      // Descripción
    strategy: ['EQUAL', Validators.required],    // Estrategia
    fechaLimite: [null, Validators.required]     // Fecha límite
  });

  this.loadData();
}


private loadData() {
  const user = JSON.parse(localStorage.getItem('currentUser') || '{}');

  // Obtener hogares
  this.householdService.getHouseholdsByUserId(user.id).subscribe(households => {
    this.households = households;
    if (households.length > 0) {
      this.contributionForm.patchValue({ householdId: households[0].id });

      // 🔹 Cargar contribuciones de ese hogar
      this.contributionsService.getContributionsByHouseholdId(households[0].id)
        .subscribe(contribs => {
          this.contributions = contribs;
          console.log('Contribuciones cargadas al iniciar:', this.contributions);
        });
    }
  });

  // Obtener facturas
  this.billService.getAllBills().subscribe(bills => {
    this.bills = bills;
  });
}

  // Método para abrir el diálogo (usado en el template)
  abrirDialogo() {
    this.contributionForm.reset({
      billId: null,
      description: '',
      fechaLimite: null,
      strategy: 'EQUAL',
      miembros: []
    });
    this.mostrarDialogo = true;
  }

  // Método para cerrar el diálogo
  cerrarDialogo() {
    this.mostrarDialogo = false;
  }

  // ✅ MÉTODO CORREGIDO: guardarContribution()
guardarContribution() {
  if (this.contributionForm.invalid) return;

  const payload: CreateContributionResource = {
    billId: Number(this.contributionForm.value.billId),
    householdId: Number(this.contributionForm.value.householdId),
    description: this.contributionForm.value.description,
    strategy: this.contributionForm.value.strategy,
    fechaLimite: this.contributionForm.value.fechaLimite
  };

  this.contributionsService.createContribution(payload).subscribe({
    next: (res) => {
      console.log('Contribución creada:', res);

      // 🔹 Recargar las contribuciones del household actual
      this.contributionsService.getContributionsByHouseholdId(payload.householdId)
        .subscribe(contribs => {
          this.contributions = contribs; // actualizar array que se usa en el *ngFor
          console.log('Contribuciones actualizadas:', this.contributions);
        });

      this.mostrarDialogo = false;
    },
    error: (err) => {
      console.error('Error creando contribución:', err);
      alert('Error al crear la contribución');
    }
  });
}

  // ✅ Método para calcular el monto faltante del representante
  private calculateMontoFaltante(contribution: any, details: any[], representative: User): number {
    const bill = this.bills.find(b => b.id === contribution.billId);
    const montoTotal = bill?.monto || 0;

    // Calcular el monto ya asignado a otros miembros
    const montoAsignado = details.reduce((sum, detail) => sum + (detail.monto || 0), 0);

    // El representante paga lo que falta
    return montoTotal - montoAsignado;
  }

  // ✅ Método para calcular la división entre miembros seleccionados
  private calculateDivisionForSelected(
    montoTotal: number,
    strategy: string,
    contributionId: number,
    selectedMembers: any[]
  ): any[] {
    const memberContributions: any[] = [];

    if (strategy === 'EQUAL') {
      // División igualitaria
      const montoPorMiembro = montoTotal / selectedMembers.length;

      selectedMembers.forEach(member => {
        memberContributions.push({
          contribution_id: contributionId,
          member_id: member.userId,
          monto: Math.round(montoPorMiembro * 100) / 100, // Redondear a 2 decimales
          status: 'PENDIENTE',
          pagado_en: null
        });
      });
    } else if (strategy === 'INCOME_BASED') {
      // División basada en ingresos
      // Obtener los ingresos de cada miembro
      const totalIngresos = selectedMembers.reduce((sum, member) => {
        return sum + (member.user?.ingresos || 0);
      }, 0);

      if (totalIngresos > 0) {
        selectedMembers.forEach(member => {
          const ingresosMiembro = member.user?.ingresos || 0;
          const porcentaje = ingresosMiembro / totalIngresos;
          const montoMiembro = montoTotal * porcentaje;

          memberContributions.push({
            contribution_id: contributionId,
            member_id: member.userId,
            monto: Math.round(montoMiembro * 100) / 100, // Redondear a 2 decimales
            status: 'PENDIENTE',
            pagado_en: null
          });
        });
      } else {
        // Si no hay ingresos registrados, fallback a división igualitaria
        console.warn('No hay ingresos registrados, usando división igualitaria');
        return this.calculateDivisionForSelected(montoTotal, 'EQUAL', contributionId, selectedMembers);
      }
    }

    return memberContributions;
  }

  get selectedBillMonto(): number {
    const billId = this.contributionForm.get('billId')?.value;
    return this.bills.find(b => b.id === billId)?.monto || 0;
  }


  getStatusClass(status: string): string {
    switch (status?.toLowerCase()) {
      case 'pagado':
        return 'p-tag-success';
      case 'pendiente':
        return 'p-tag-warning';
      case 'vencido':
        return 'p-tag-danger';
      default:
        return 'p-tag-secondary';
    }
  }

  getStatusLabel(status: string): string {
    switch (status?.toLowerCase()) {
      case 'pagado':
        return 'Pagado';
      case 'pendiente':
        return 'Pendiente';
      case 'vencido':
        return 'Vencido';
      default:
        return status || 'Sin estado';
    }
  }

}

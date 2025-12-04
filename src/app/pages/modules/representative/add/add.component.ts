import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { HouseholdService } from '../../services/household.service';
import { Household } from '../../interfaces/household';
import { HouseholdResponse } from '../../interfaces/householdresponse';

@Component({
  selector: 'app-agregar-hogar',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ToastModule
  ],
  templateUrl: './add.component.html',
  styleUrls: ['./add.component.css'],
  providers: [MessageService]
})
export class AgregarHogarComponent implements OnInit {

  household: Household = { name: '', description: '', currency: 'PEN', representanteId: 0 };
  hogares: HouseholdResponse[] = [];
  loading = false;
  errorMessage = '';

  constructor(private householdService: HouseholdService, private messageService: MessageService) {}

  ngOnInit() {
    this.cargarHogaresDelUsuario();
  }

  cargarHogaresDelUsuario() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser')!);
    if (!currentUser || !currentUser.id) return;

    this.householdService.getAllHouseholds().subscribe({
      next: (hogares) => {
        this.hogares = hogares
          .filter(h => h.representanteId === currentUser.id)
          .map(h => ({
            id: h.id!, 
            name: h.name,
            description: h.description,
            currency: h.currency,
            representanteId: h.representanteId
          }));
      },
      error: (err) => console.error("Error obteniendo hogares:", err)
    });
  }

  crearHogar() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser')!);
    if (!currentUser || !currentUser.id) return;

    this.household.representanteId = currentUser.id;

    this.householdService.createHousehold(this.household).subscribe({
      next: (createdHousehold) => {
        this.hogares.push(createdHousehold);
        this.showSuccess('Hogar creado', `El hogar "${createdHousehold.name}" se creó correctamente`);
        this.household = { name: '', description: '', currency: 'PEN', representanteId: currentUser.id };
      },
      error: () => this.showError('Error', 'No se pudo crear el hogar')
    });
  }

  private showSuccess(summary: string, detail: string) {
    this.messageService.add({ severity: 'success', summary, detail });
  }

  private showError(summary: string, detail: string) {
    this.messageService.add({ severity: 'error', summary, detail });
  }
}

import { Component, OnInit } from '@angular/core';
import { HouseholdService } from '../../services/household.service';
import { Household } from '../../interfaces/household';
import { HouseholdResponse } from '../../interfaces/householdresponse';

@Component({
  selector: 'app-agregar-hogar',
  standalone:false,
  templateUrl: './add.component.html',
  styleUrls: ['./add.component.css']
})
export class AgregarHogarComponent implements OnInit {

  household: Household = {
    name: '',
    description: '',
    currency: 'PEN',
    representanteId: 0
  };

  hogares: HouseholdResponse[] = [];

  loading = false;
  errorMessage = '';

  constructor(private householdService: HouseholdService) {}

ngOnInit() {
  this.cargarHogaresDelUsuario();
}

cargarHogaresDelUsuario() {
  const currentUser = JSON.parse(localStorage.getItem('currentUser')!);
  if (!currentUser || !currentUser.id) return;

  this.householdService.getAllHouseholds().subscribe({
    next: (hogares) => {
      // Filtra y convierte cada Household a HouseholdResponse
      this.hogares = hogares
        .filter(h => h.representanteId === currentUser.id)
        .map(h => ({
          id: h.id!, // el ! asegura que no sea undefined
          name: h.name,
          description: h.description,
          currency: h.currency,
          representanteId: h.representanteId
        }));
      console.log("Hogares cargados solo del usuario:", this.hogares);
    },
    error: (err) => console.error("Error obteniendo hogares:", err)
  });
}


  // Crear un nuevo hogar
  crearHogar() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser')!);
    if (!currentUser || !currentUser.id) {
      console.error("No se encontró usuario activo");
      return;
    }

    // Asignar representanteId
    this.household.representanteId = currentUser.id;

    this.householdService.createHousehold(this.household).subscribe({
      next: (createdHousehold) => {
        this.hogares.push(createdHousehold); // agregar a la lista
        console.log("Hogar creado y agregado al listado:", createdHousehold);

        // Limpiar formulario
        this.household = { name: '', description: '', currency: 'PEN', representanteId: currentUser.id };
      },
      error: (err) => {
        console.error("Error al crear hogar:", err);
        this.errorMessage = 'No se pudo crear el hogar.';
      }
    });
  }
}

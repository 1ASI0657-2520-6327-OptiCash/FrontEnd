import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BillResponse, CreateBillRequest } from '../../interfaces/bills';
import { User } from '../../../../core/interfaces/auth';
import { BillsService } from '../../services/bills.service';
import { HouseholdService } from '../../services/household.service';

@Component({
  selector: 'app-bills',
  standalone: false,
  templateUrl: './bills.component.html',
  styleUrls: ['./bills.component.css']
})
export class BillsComponent implements OnInit {

  bills: BillResponse[] = [];
  hogaresDelUsuario: any[] = [];
  householdId: number | null = null;
  loading = true;
  formVisible = false;
  billForm!: FormGroup;
  currentUser!: User;
  isRepresentante = false;
  errorMessage = '';
  editingBillId: number | null = null;

  constructor(
    private billsService: BillsService,
    private householdService: HouseholdService,
    private fb: FormBuilder
  ) {}

  ngOnInit() {
    try {
      const userString = localStorage.getItem('currentUser');
      if (userString) {
        this.currentUser = JSON.parse(userString);
        this.isRepresentante = this.currentUser.roles.includes('ROLE_REPRESENTANTE');
      } else {
        this.errorMessage = 'No se encontró información del usuario';
        this.loading = false;
        return;
      }
    } catch (error) {
      this.errorMessage = 'Error al cargar información del usuario';
      this.loading = false;
      return;
    }

    this.initializeForm();
    this.loadUserHouseholds();
  }

  private initializeForm() {
    this.billForm = this.fb.group({
      householdId: [null, Validators.required],  // Se actualizará cuando carguen los hogares
      descripcion: ['', Validators.required],
      monto: [null, [Validators.required, Validators.min(0)]],
      fecha: [new Date().toISOString().substring(0, 10), Validators.required]
    });
  }

private loadUserHouseholds() {
  this.householdService.getHouseholdsByUserId(this.currentUser.id).subscribe({
    next: (households) => {
      // Aquí aseguramos que solo sean los hogares de este usuario
      this.hogaresDelUsuario = households.filter(h => h.representanteId === this.currentUser.id);

      if (this.hogaresDelUsuario.length > 0) {
        this.householdId = this.hogaresDelUsuario[0].id!;
        this.billForm.patchValue({ householdId: this.householdId });
        this.loadBills();
      } else {
        this.errorMessage = 'No se encontraron hogares para este usuario';
        this.loading = false;
      }
    },
    error: (err) => {
      console.error('Error al cargar hogares:', err);
      this.errorMessage = 'Error al cargar hogares';
      this.loading = false;
    }
  });
}



  private loadBills() {
    if (!this.householdId) return;

    this.billsService.getBillsByHousehold(this.householdId).subscribe({
      next: (bills) => {
        this.bills = bills;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar bills:', err);
        this.errorMessage = 'Error al cargar las facturas';
        this.loading = false;
      }
    });
  }

  showForm() {
    if (!this.isRepresentante) {
      alert('Solo los representantes pueden crear bills');
      return;
    }
    this.editingBillId = null;
    this.formVisible = true;
    this.billForm.reset({
      householdId: this.householdId,
      descripcion: '',
      monto: null,
      fecha: new Date().toISOString().substring(0, 10)
    });
  }

  submit() {
    if (!this.billForm.valid) return;

    if (this.editingBillId) {
      this.updateBill();
    } else {
      this.createBill();
    }
  }

private createBill() {
  const householdId = this.billForm.value.householdId;
  if (!householdId) {
    alert('Debes seleccionar un hogar antes de crear la factura');
    return;
  }

  const createBillRequest: CreateBillRequest = {
    householdId,
    description: this.billForm.value.descripcion, // <-- aquí cambias al campo correcto
    monto: this.billForm.value.monto,
    fecha: this.billForm.value.fecha,
    createdBy: this.currentUser.id           // agregamos el ID del usuario
  };

  console.log('Payload enviado:', createBillRequest);

  this.billsService.createBill(createBillRequest).subscribe({
    next: (savedBill) => {
      this.bills.push(savedBill);
      this.formVisible = false;
      this.billForm.reset({ householdId });
    },
    error: (err) => {
      console.error('Error creando bill:', err);
      alert('Error al crear la factura');
    }
  });
}



 private updateBill() {
  if (!this.editingBillId) return;

  const updateRequest = {
    description: this.billForm.value.descripcion,  // aquí debes usar description
    monto: this.billForm.value.monto,
    fecha: this.billForm.value.fecha
  };

  this.billsService.updateBill(this.editingBillId, updateRequest).subscribe({
    next: (updatedBill) => {
      const idx = this.bills.findIndex(b => b.id === this.editingBillId);
      if (idx !== -1) this.bills[idx] = updatedBill;
      this.formVisible = false;
      this.editingBillId = null;
    },
    error: (err) => {
      console.error('Error actualizando bill:', err);
      alert('Error al actualizar la factura');
    }
  });
}


 editBill(bill: BillResponse) {
  if (!this.isRepresentante) return;

  this.editingBillId = bill.id;
  this.formVisible = true;
  this.billForm.patchValue({
    householdId: bill.householdId,
    descripcion: bill.description,  // aquí asignas el campo 'description' al form control 'descripcion'
    monto: bill.monto,
    fecha: bill.fecha
  });
}

  deleteBill(billId: number) {
    if (!this.isRepresentante) return;

    if (!confirm('¿Seguro que quieres eliminar esta factura?')) return;

    this.billsService.deleteBill(billId).subscribe({
      next: () => this.bills = this.bills.filter(b => b.id !== billId),
      error: (err) => alert('Error al eliminar factura')
    });
  }

  cancelForm() {
    this.formVisible = false;
    this.billForm.reset({ householdId: this.householdId });
    this.editingBillId = null;
  }

  reloadData() {
    this.loading = true;
    this.errorMessage = '';
    this.loadUserHouseholds();
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(amount);
  }
}

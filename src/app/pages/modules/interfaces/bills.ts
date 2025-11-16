export interface Bill {
  id: number;
  householdId: number;
  description: string;  // cambió de 'descripcion'
  monto: number;
  createdBy: number;
  fecha: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateBillRequest {
  householdId: number;
  description: string;  // cambió de 'descripcion'
  monto: number;
  createdBy: number;    // agregado
  fecha: string;
}

export interface UpdateBillRequest {
  description: string;
  monto: number;
  fecha: string;
}

export interface BillResponse {
  id: number;
  householdId: number;
  description: string;
  monto: number;
  createdBy: number;
  fecha: string;
  createdAt: string;
  updatedAt: string;
}

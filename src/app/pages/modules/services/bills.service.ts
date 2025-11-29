import { Injectable } from '@angular/core';
import { environment } from '../../../core/environments/environment';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BillResponse, CreateBillRequest, UpdateBillRequest } from '../interfaces/bills';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class BillsService {

private billsUrl = `${environment.urlBackend}/bills`;

  constructor(private http: HttpClient) { }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('accessToken');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

 createBill(billData: CreateBillRequest): Observable<BillResponse> {
  const headers = this.getHeaders();
  return this.http.post<BillResponse>(this.billsUrl, billData, { headers });
}


  // Obtener todas las bills
  getAllBills(): Observable<BillResponse[]> {
    const headers = this.getHeaders();
    return this.http.get<BillResponse[]>(`${this.billsUrl}`, { headers });
  }

  // Obtener una bill por ID
  getBillById(billId: number): Observable<BillResponse> {
    const headers = this.getHeaders();
    return this.http.get<BillResponse>(`${this.billsUrl}/${billId}`, { headers });
  }

  // Actualizar una bill por ID
  updateBill(billId: number, billData: UpdateBillRequest): Observable<BillResponse> {
    const headers = this.getHeaders();
    return this.http.put<BillResponse>(`${this.billsUrl}/${billId}`, billData, { headers });
  }

  // Eliminar una bill por ID (solo ROLE_REPRESENTANTE)
  deleteBill(billId: number): Observable<void> {
    const headers = this.getHeaders();
    return this.http.delete<void>(`${this.billsUrl}/${billId}`, { headers });
  }

  // Métodos auxiliares para filtrar por household (si necesitas)
  getBillsByHousehold(householdId: number): Observable<BillResponse[]> {
    return new Observable(observer => {
      this.getAllBills().subscribe(bills => {
        const filteredBills = bills.filter(bill => bill.householdId === householdId);
        observer.next(filteredBills);
        observer.complete();
      });
    });
  }
}

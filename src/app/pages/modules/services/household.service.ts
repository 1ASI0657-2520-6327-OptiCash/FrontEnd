import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Household } from '../interfaces/household';
import { environment } from '../../../core/environments/environment';
import { HouseholdResponse } from '../../../../app/pages/modules/interfaces/householdresponse';

@Injectable({
  providedIn: 'root'
})
export class HouseholdService {

  private gatewayUrl = 'http://localhost:8080/api/v1';

  constructor(private http: HttpClient) {}
private getAuthHeaders(): HttpHeaders {
  const token = localStorage.getItem('accessToken');
  if (!token) throw new Error('No se encontró JWT del usuario activo');
  return new HttpHeaders({ 'Authorization': `Bearer ${token}` });
}


  createHousehold(household: Household): Observable<HouseholdResponse> {
    const headers = this.getAuthHeaders();
    return this.http.post<HouseholdResponse>(`${this.gatewayUrl}/households`, household, { headers });
  }

  addHouseholdMember(member: { householdId: number; userId: number }): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post(`${this.gatewayUrl}/household-members`, member, { headers });
  }
  
getHouseholdById(id: number): Observable<Household> {
  const headers = this.getAuthHeaders();
  return this.http.get<Household>(`${this.gatewayUrl}/households/${id}`, { headers });
}
getHouseholdsByUserId(userId: number): Observable<HouseholdResponse[]> {
  const headers = this.getAuthHeaders();
  return this.http.get<HouseholdResponse[]>(`${this.gatewayUrl}/households?representanteId=${userId}`, { headers });
}


getAllHouseholds(): Observable<Household[]> {
  const headers = this.getAuthHeaders();
  return this.http.get<Household[]>(`${this.gatewayUrl}/households`, { headers });
}


}
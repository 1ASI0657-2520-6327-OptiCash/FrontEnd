import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Household } from '../interfaces/household';
import { environment } from '../../../../app/core/environments/environment';
import { HouseholdResponse } from '../../../../app/pages/modules/interfaces/householdresponse';

@Injectable({
  providedIn: 'root'
})
export class HouseholdService {

  private baseUrl =  `${environment.urlBackend}`;

  constructor(private http: HttpClient) {}
private getAuthHeaders(): HttpHeaders {
  const token = localStorage.getItem('accessToken');
  if (!token) throw new Error('No se encontró JWT del usuario activo');
  return new HttpHeaders({ 'Authorization': `Bearer ${token}` });
}


  createHousehold(household: Household): Observable<HouseholdResponse> {
    const headers = this.getAuthHeaders();
    return this.http.post<HouseholdResponse>(`${this.baseUrl}/households`, household, { headers });
  }

  addHouseholdMember(member: { householdId: number; userId: number }): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post(`${this.baseUrl}/household-members`, member, { headers });
  }

 getHouseholdById(id: number): Observable<Household> {
  const headers = this.getAuthHeaders();
  return this.http.get<Household>(`${this.baseUrl}/households/${id}`, { headers });
}
getHouseholdsByUserId(userId: number): Observable<HouseholdResponse[]> {
  const headers = this.getAuthHeaders();
  return this.http.get<HouseholdResponse[]>(`${this.baseUrl}/households?representanteId=${userId}`, { headers });
}


getAllHouseholds(): Observable<Household[]> {
  const headers = this.getAuthHeaders();
  return this.http.get<Household[]>(`${this.baseUrl}/households`, { headers });
}


}

import { Injectable } from '@angular/core';
import { environment } from '../../../core/environments/environment';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { MemberContributionResource } from '../interfaces/member-contribution';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MemberContributionService {
  private memberContributionUrl = `${environment.urlBackend}/member-contributions`;

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('accessToken');
    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  // ✅ Obtener todas las contribuciones
  getAll(): Observable<MemberContributionResource[]> {
    const headers = this.getHeaders();
    return this.http.get<MemberContributionResource[]>(this.memberContributionUrl, { headers });
  }

  // ✅ Obtener por ID compuesto (contributionId + memberId)
  getByIds(contributionId: number, memberId: number): Observable<MemberContributionResource> {
    const headers = this.getHeaders();
    const url = `${this.memberContributionUrl}?contributionId=${contributionId}&memberId=${memberId}`;
    return this.http.get<MemberContributionResource>(url, { headers });
  }

  // ✅ Crear nueva contribución
  create(contribution: MemberContributionResource): Observable<MemberContributionResource> {
    const headers = this.getHeaders();
    return this.http.post<MemberContributionResource>(this.memberContributionUrl, contribution, { headers });
  }

  // ✅ Actualizar contribución (usando ID compuesto)
  update(contribution: MemberContributionResource): Observable<MemberContributionResource> {
    const headers = this.getHeaders();
    const url = `${this.memberContributionUrl}/${contribution.contributionId}/${contribution.memberId}`;
    return this.http.put<MemberContributionResource>(url, contribution, { headers });
  }

  // ✅ Eliminar contribución (usando ID compuesto)
  delete(contributionId: number, memberId: number): Observable<void> {
    const headers = this.getHeaders();
    const url = `${this.memberContributionUrl}/${contributionId}/${memberId}`;
    return this.http.delete<void>(url, { headers });
  }
}


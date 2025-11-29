import { Injectable } from '@angular/core';
import { environment } from '../../../core/environments/environment';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Contribution, CreateContributionRequest, UpdateContributionRequest } from '../interfaces/contributions';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ContributionsService {
private contributionsUrl = `${environment.urlBackend}/api/v1/contributions`;

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('accessToken');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  /**
   * Obtiene todas las contribuciones
   */
  getAllContributions(): Observable<Contribution[]> {
    const headers = this.getHeaders();
    return this.http.get<Contribution[]>(this.contributionsUrl, { headers });
  }

  /**
   * Obtiene una contribución por ID
   */
  getContributionById(id: number): Observable<Contribution> {
    const headers = this.getHeaders();
    return this.http.get<Contribution>(`${this.contributionsUrl}/${id}`, { headers });
  }

  /**
   * Crea una nueva contribución
   */
  createContribution(contribution: CreateContributionRequest): Observable<Contribution> {
    const headers = this.getHeaders();
    return this.http.post<Contribution>(this.contributionsUrl, contribution, { headers });
  }

  /**
   * Actualiza una contribución existente
   */
  updateContribution(id: number, contribution: UpdateContributionRequest): Observable<Contribution> {
    const headers = this.getHeaders();
    return this.http.put<Contribution>(`${this.contributionsUrl}/${id}`, contribution, { headers });
  }

  /**
   * Elimina una contribución por ID
   */
  deleteContribution(id: number): Observable<void> {
    const headers = this.getHeaders();
    return this.http.delete<void>(`${this.contributionsUrl}/${id}`, { headers });
  }

  /**
   * Obtiene contribuciones filtradas por household ID (si tu backend lo soporta)
   */
  getContributionsByHouseholdId(householdId: number): Observable<Contribution[]> {
    const headers = this.getHeaders();
    return this.http.get<Contribution[]>(`${this.contributionsUrl}?householdId=${householdId}`, { headers });
  }
}

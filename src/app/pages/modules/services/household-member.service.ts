import { Injectable } from '@angular/core';
import { CreateHouseholdMemberRequest, HouseholdMember } from '../interfaces/household-member';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { environment } from '../../../core/environments/environment';
import { catchError, map, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class HouseholdMemberService {
  private memberUrl = `${environment.urlBackend}/household-members`;

  constructor(private http: HttpClient) { }

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('accessToken');
    return new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
  }

  // MÉTODO PRINCIPAL MEJORADO: Filtrar por household_id
  getByHouseholdId(householdId: number): Observable<HouseholdMember[]> {
    const headers = this.getAuthHeaders();
    console.log('🔍 Buscando miembros para householdId:', householdId);

    return this.http.get<HouseholdMember[]>(this.memberUrl, { headers }).pipe(
      tap(members => {
        console.log('📦 Total miembros recibidos:', members.length);
        console.log('📦 Estructura primer miembro:', members[0]);

        // Verificar qué campos están disponibles
        if (members.length > 0) {
          const firstMember = members[0] as any;
          console.log('🔍 Campos disponibles:', Object.keys(firstMember));
          console.log('🔍 householdId (camelCase):', firstMember.householdId);
          console.log('🔍 household_id (snake_case):', firstMember.household_id);
        }
      }),
      map(members => {
        // Filtrar usando múltiples estrategias
        const filtered = members.filter(member => {
          const memberAny = member as any;

          // Estrategia 1: camelCase
          const matchesCamelCase = member.householdId === householdId;

          // Estrategia 2: snake_case
          const matchesSnakeCase = memberAny.household_id === householdId;

          // Estrategia 3: conversión de tipos
          const matchesStringComparison =
            String(member.householdId) === String(householdId) ||
            String(memberAny.household_id) === String(householdId);

          const matches = matchesCamelCase || matchesSnakeCase || matchesStringComparison;

          if (matches) {
            console.log('✅ Miembro encontrado:', member);
          }

          return matches;
        });

        console.log('🎯 Miembros filtrados:', filtered.length);
        console.log('🎯 Lista final:', filtered);
        return filtered;
      }),
      catchError(error => {
        console.error('❌ Error al obtener miembros:', error);
        return throwError(() => error);
      })
    );
  }

  // ✅ NUEVO: Verificar si un usuario ya es miembro del hogar
  checkIfUserIsMember(userId: number, householdId: number): Observable<boolean> {
    return this.getByHouseholdId(householdId).pipe(
      map(members => members.some(member => member.userId === userId)),
      catchError(error => {
        console.error('❌ Error al verificar membresía:', error);
        return throwError(() => error);
      })
    );
  }

  // Crear un nuevo miembro del hogar
  createMemberLink(data: CreateHouseholdMemberRequest): Observable<HouseholdMember> {
    const headers = this.getAuthHeaders();
    console.log('➕ Creando miembro:', data);
    console.log('🌐 URL:', this.memberUrl);
    console.log('🔑 Headers:', headers);
    console.log('🔑 Authorization header:', headers.get('Authorization'));

    return this.http.post<HouseholdMember>(this.memberUrl, data, { headers }).pipe(
      tap(response => {
        console.log('✅ Miembro creado exitosamente:', response);
      }),
      catchError(error => {
        console.error('❌ Error al crear miembro:', error);
        console.error('❌ Status:', error.status);
        console.error('❌ Error body:', error.error);

        // ✅ MANEJO DE ERRORES ESPECÍFICOS
        let errorMessage = 'Error desconocido al crear el miembro';
        switch (error.status) {
          case 400:
            errorMessage = 'Datos inválidos proporcionados';
            break;
          case 401:
            errorMessage = 'No autorizado para realizar esta acción';
            break;
          case 409:
            errorMessage = 'El usuario ya es miembro del hogar';
            break;
          case 404:
            errorMessage = 'Usuario o hogar no encontrado';
            break;
          case 500:
            errorMessage = 'Error interno del servidor';
            break;
        }

        return throwError(() => ({
          ...error,
          userMessage: errorMessage
        }));
      })
    );
  }

  // Eliminar un miembro del hogar
  deleteMemberLink(id: number): Observable<void> {
    const headers = this.getAuthHeaders();
    console.log('🗑️ Eliminando miembro ID:', id);

    return this.http.delete<void>(`${this.memberUrl}/${id}`, { headers }).pipe(
      tap(() => {
        console.log('✅ Miembro eliminado');
      }),
      catchError(error => {
        console.error('❌ Error al eliminar miembro:', error);
        return throwError(() => error);
      })
    );
  }

  // ✅ NUEVO: Obtener todos los miembros (sin filtrar)
  getAllMembers(): Observable<HouseholdMember[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<HouseholdMember[]>(this.memberUrl, { headers }).pipe(
      tap(members => {
        console.log('📦 Todos los miembros:', members);
      }),
      catchError(error => {
        console.error('❌ Error al obtener todos los miembros:', error);
        return throwError(() => error);
      })
    );
  }
}

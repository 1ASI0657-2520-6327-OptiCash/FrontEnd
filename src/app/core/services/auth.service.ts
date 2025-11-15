import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../environments/environment';
import { Router } from '@angular/router';
import { Observable, switchMap, tap } from 'rxjs';
import { AuthResponse, SignInRequest, SignUpRequest, User } from '../interfaces/auth';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private authUrl = `${environment.urlBackend}/authentication`;
  private usersUrl = `${environment.urlBackend}/users`;

  constructor(private http: HttpClient, private router: Router) {}

  // Registro
  signUp(payload: SignUpRequest): Observable<User> {
    return this.http.post<User>(`${this.authUrl}/sign-up`, payload).pipe(
      tap(user => console.log('Usuario registrado:', user))
    );
  }

  // Login
  signIn(payload: SignInRequest): Observable<User> {
    return this.http.post<AuthResponse>(`${this.authUrl}/sign-in`, payload).pipe(
      tap(res => {
        // Guardar token y userId
        localStorage.setItem('accessToken', res.token);
        localStorage.setItem('userId', res.id.toString());
      }),
      switchMap(res => this.getUserById(res.id).pipe(
        tap(user => {
          // Guardar info del usuario y rol
          localStorage.setItem('currentUser', JSON.stringify(user));
          if (user.roles && user.roles.length > 0) {
            localStorage.setItem('userRole', user.roles[0]);
          } else {
            localStorage.setItem('userRole', '');
          }
        })
      ))
    );
  }

  getUserById(id: number): Observable<User> {
    const token = localStorage.getItem('accessToken') || '';
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    return this.http.get<User>(`${this.usersUrl}/${id}`, { headers });
  }

  getAllUsers(): Observable<User[]> {
    const token = localStorage.getItem('accessToken') || '';
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    return this.http.get<User[]>(`${this.usersUrl}`, { headers });
  }

  getCurrentUser(): User | null {
    const user = localStorage.getItem('currentUser');
    return user ? JSON.parse(user) : null;
  }

  getCurrentRole(): string {
    return localStorage.getItem('userRole') || '';
  }

  clearSession(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('userId');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('userRole');
  }
}

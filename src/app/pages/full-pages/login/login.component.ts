import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { SidebarService } from '../../../core/services/sidebar.service';
import { AuthService } from '../../../core/services/auth.service';
import { SignInRequest } from '../../../core/interfaces/auth';

@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  username = '';
  password = '';
  error = '';

  constructor(
    private authService: AuthService,
    private sidebarService: SidebarService,
    private router: Router
  ) {}

  onLogin() {
    const payload: SignInRequest = {
      username: this.username,
      password: this.password
    };
    console.log("SignIn Payload", payload);

    this.authService.signIn(payload).subscribe({
      next: () => {
        // 🔹 Token y usuario ya están en localStorage gracias a AuthService
        const currentUser = JSON.parse(localStorage.getItem('currentUser')!);
        const userRole = localStorage.getItem('userRole') || '';

        if (!currentUser) {
          this.error = 'Error: no se pudo obtener la información del usuario.';
          return;
        }

        // 🔹 Generar menú del sidebar
        this.sidebarService.generateMenu();

        // 🔹 Navegar según rol
        if (userRole === 'ROLE_REPRESENTANTE') {
          this.router.navigate(['/representante']);
        } else if (userRole === 'ROLE_MIEMBRO') {
          this.router.navigate(['/miembro']);
        } else {
          this.router.navigate(['/']);
        }
      },
      error: (err) => {
        this.error = 'Credenciales inválidas.';
        console.error(err);
      }
    });
  }
}

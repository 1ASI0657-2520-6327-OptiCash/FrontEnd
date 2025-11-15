import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { SignUpRequest } from '../../../core/interfaces/auth';
import { switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-register',
    standalone: false,
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {

  registerForm: FormGroup;
  isSubmitting = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.registerForm = this.fb.group({
      username: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      repeatPassword: ['', Validators.required],
      income: [0, [Validators.required, Validators.min(0)]],
      role: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });
  }

  private passwordMatchValidator(formGroup: FormGroup) {
    const password = formGroup.get('password')?.value;
    const repeatPassword = formGroup.get('repeatPassword')?.value;
    return password === repeatPassword ? null : { mismatch: true };
  }
register() {
  console.log('Click en Registrar recibido');
  console.log('Valores del form:', this.registerForm.value);
  console.log('Formulario válido:', this.registerForm.valid);
  
  if (this.registerForm.invalid || this.isSubmitting) {
    this.registerForm.markAllAsTouched();
    return;
  }

  this.isSubmitting = true;
  this.errorMessage = '';

  const formValue = this.registerForm.value;

  // 🔹 Validamos que se haya seleccionado un rol
  if (!formValue.role) {
    this.errorMessage = 'Debes seleccionar un rol';
    this.isSubmitting = false;
    return;
  }

  const payload: SignUpRequest = {
    username: formValue.username,
    email: formValue.email,
    password: formValue.password,
    income: Number(formValue.income), // aseguramos que sea number
    roles: [formValue.role]
  };

  // 🔹 Registro primero
  this.authService.signUp(payload).pipe(
    switchMap(() => {
      console.log('Usuario creado, intentando login...');
      // 🔹 Login automático
      return this.authService.signIn({ username: payload.username, password: payload.password });
    })
  ).subscribe({
    next: () => {
      const role = localStorage.getItem('userRole');
      console.log('Rol guardado:', role);
      if (role === 'ROLE_REPRESENTANTE') {
        this.router.navigate(['/representante']);
      } else if (role === 'ROLE_MIEMBRO') {
        this.router.navigate(['/miembro']);
      } else {
        this.router.navigate(['/']); // fallback seguro
      }
      this.isSubmitting = false;
    },
    error: (err) => {
      console.error('Error al registrar o loguear:', err);
      this.errorMessage = 'Error al registrar el usuario';
      this.isSubmitting = false;
    }
  });
}

}

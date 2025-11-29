import { Component, OnDestroy, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { InputSwitchModule } from 'primeng/inputswitch';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { environment } from '../../../../../../src/app/core/environments/environment';
import { AuthService } from '../../../../../../src/app/core/services/auth.service';
import { UserSettings } from '../../../../../../src/app/core/interfaces/user-settings';
import { User } from '../../../../../../src/app/core/interfaces/auth';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslateModule,
    CardModule,
    ButtonModule,
    DropdownModule,
    InputSwitchModule,
    InputTextModule,
    PasswordModule,
  ],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css']
})
export class SettingsComponent implements OnInit, OnDestroy {

  profileForm!: FormGroup;
  passwordForm!: FormGroup;
  settingsForm!: FormGroup;
  userId!: number;
  settingId: number | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private http: HttpClient,
    private fb: FormBuilder,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.profileForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
    });

    this.passwordForm = this.fb.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });

    this.settingsForm = this.fb.group({
      language: ['es'],
      dark_mode: [false],
      notifications_enabled: [true]
    });

    const currentUser = this.authService.getCurrentUser();
    if (currentUser && currentUser.id) {
      this.userId = currentUser.id;
      this.loadUserData();
      this.loadSettingsData();
    } else {
      console.error('No se encontró usuario en localStorage.');
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  passwordMatchValidator(form: AbstractControl): ValidationErrors | null {
    const newPassword = form.get('newPassword')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;
    return newPassword === confirmPassword ? null : { mismatch: true };
  }

  private getAuthHeaders(): { headers: HttpHeaders } {
    const token = localStorage.getItem('accessToken') || '';
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    return { headers };
  }

  loadUserData(): void {
    this.http.get<User>(`${environment.urlBackend}/users/${this.userId}`, this.getAuthHeaders())
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: userData => this.profileForm.patchValue(userData),
        error: err => console.error('Error cargando usuario:', err)
      });
  }

  loadSettingsData(): void {
    this.http.get<UserSettings[]>(`${environment.urlBackend}/settings?user_id=${this.userId}`, this.getAuthHeaders())
      .pipe(takeUntil(this.destroy$))
      .subscribe(settings => {
        if (settings.length > 0) {
          const existingSetting = settings[0];
          this.settingId = existingSetting.id;
          this.settingsForm.patchValue(existingSetting);
        }
      });
  }

  saveProfile(): void {
    if (this.profileForm.invalid) return;
    this.http.patch(`${environment.urlBackend}/users/${this.userId}`, this.profileForm.value, this.getAuthHeaders())
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => alert('Perfil actualizado con éxito'));
  }

  saveSettings(): void {
    if (this.settingsForm.invalid) return;
    const payload = { ...this.settingsForm.value, user_id: this.userId };
    const request = this.settingId
      ? this.http.patch(`${environment.urlBackend}/settings/${this.settingId}`, payload, this.getAuthHeaders())
      : this.http.post(`${environment.urlBackend}/settings`, payload, this.getAuthHeaders());

    request.pipe(takeUntil(this.destroy$)).subscribe(() => alert('Configuración guardada'));
  }

  changePassword(): void {
    if (this.passwordForm.invalid) return;
    const { currentPassword, newPassword } = this.passwordForm.value;

    // 🔹 Backend debe validar password; frontend solo envía
    this.http.patch(`${environment.urlBackend}/users/${this.userId}/password`, { currentPassword, newPassword }, this.getAuthHeaders())
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          alert('Contraseña actualizada con éxito');
          this.passwordForm.reset();
        },
        error: () => alert('Error: la contraseña actual es incorrecta.')
      });
  }

  deleteAccount(): void {
    const confirmation = prompt('Esta acción es irreversible. Escribe tu correo para confirmar:');
    if (confirmation && confirmation.toLowerCase() === this.profileForm.value.email.toLowerCase()) {
      this.http.delete(`${environment.urlBackend}/users/${this.userId}`, this.getAuthHeaders())
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => alert('Cuenta eliminada.'));
    } else {
      alert('Confirmación incorrecta, la cuenta no fue eliminada.');
    }
  }
}

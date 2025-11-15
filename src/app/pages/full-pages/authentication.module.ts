import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AuthenticationRoutingModule } from './authentication-routing.module';
import { NavBarComponent } from '../../core/components/nav-bar/nav-bar.component';
import { TheFooterComponent } from '../../core/components/the-footer/the-footer.component';
import { ForgotPasswordComponent } from './forgot-password/forgot-password.component';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { ResetPasswordComponent } from './reset-password/reset-password.component';
import { CoreModule } from '../../core/core.module';
import { AppRoutingModule } from '../../app-routing.module';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {TranslatePipe} from '@ngx-translate/core';
import { TranslateModule } from '@ngx-translate/core';
import { LanguageSwitcherComponent } from '../../core/components/language-switcher/language-switcher.component';


@NgModule({
  declarations: [
    ForgotPasswordComponent,
    LoginComponent,
    RegisterComponent,
    ResetPasswordComponent
  ],
  imports: [
    CommonModule,
    CoreModule,
    AuthenticationRoutingModule,
    FormsModule,
    TranslateModule,
    ReactiveFormsModule,
    LanguageSwitcherComponent
  ]
})
export class AuthenticationModule { }

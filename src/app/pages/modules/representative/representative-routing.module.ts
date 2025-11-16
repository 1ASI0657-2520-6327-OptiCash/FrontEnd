import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ContributionsComponent } from './contributions/contributions.component';
import { SettingsComponent } from './settings/settings.component';
import { MembersComponent } from './members/members.component';
import { BillsComponent } from './bills/bills.component';
import { HomeComponent } from './home/home.component';
import { AgregarHogarComponent } from './add/add.component';

const routes: Routes = [
  {path: '', redirectTo: 'home', pathMatch: 'full'},
  {path: 'add', component: AgregarHogarComponent},
  {path: 'home', component: HomeComponent},
  {path: 'members', component: MembersComponent},
  {path: 'bills', component: BillsComponent},
  {path: 'contributions', component: ContributionsComponent},
  {path: 'settings', component: SettingsComponent}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class RepresentativeRoutingModule { }

import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { TableModule } from 'primeng/table';
import { CardModule } from 'primeng/card';
import { environment } from '../../../../../app/core/environments/environment';
import { forkJoin } from 'rxjs';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-memb-status',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    TableModule,
    CardModule,  
    ToastModule // agregado

  ],
  templateUrl: './memb-status.component.html',
  styleUrls: ['./memb-status.component.css']
})
export class MembStatusComponent implements OnInit {
  userId!: number;
  statusList: any[] = [];

constructor(private http: HttpClient, private messageService: MessageService) {}

  ngOnInit(): void {
    const currentUser = JSON.parse(localStorage.getItem('currentUser')!);
    this.userId = currentUser.id;

    const token = localStorage.getItem('accessToken');
    if (!token) {
      console.error('No se encontró token en localStorage');
      return;
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    const base = 'https://opticash.duckdns.org/api/v1'; // URL base real

    const memberContributions$ = this.http.get<any[]>(`${base}/member-contributions?member_id=${this.userId}`, { headers });
    const contributions$ = this.http.get<any[]>(`${base}/contributions`, { headers });
    const bills$ = this.http.get<any[]>(`${base}/bills`, { headers });

   forkJoin([memberContributions$, contributions$, bills$]).subscribe({
  next: ([mcList, allContribs, bills]) => {
    this.statusList = mcList
      .filter(mc => Number(mc.memberId) === Number(this.userId))
      .map(mc => {
        const contrib = allContribs.find(c => Number(c.id) === Number(mc.contributionId));
        if (!contrib) return null;
        const bill = bills.find(b => Number(b.id) === Number(contrib.billId));

        return {
          descripcionFactura: bill?.description,
          montoFactura: bill?.amount,
          fechaFactura: bill?.date,
          descripcionContrib: contrib.description,
          strategy: contrib.strategy,
          fechaLimite: contrib.dueDate,
          monto: mc.monto,
          status: mc.status,
          pagadoEn: mc.pagadoEn
        };
      })
      .filter(c => c !== null);

    this.showSuccess('Estados cargadas', 'Los estados de tus pagos se han cargado correctamente.');
  },
  error: (err) => {
    console.error('Error cargando los estados:', err);
    this.showError('Error al cargar estados', 'Vuelve a intentar más tarde.');
  }
});

  }
  private showSuccess(summary: string, detail: string) {
  this.messageService.add({ severity: 'success', summary, detail });
}

private showError(summary: string, detail: string) {
  this.messageService.add({ severity: 'error', summary, detail });
}

}

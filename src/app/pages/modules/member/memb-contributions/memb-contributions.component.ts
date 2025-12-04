import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-memb-contributions',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    TableModule,
    ButtonModule,
    TooltipModule,
    ToastModule   // ✅ agregado

  ],
  templateUrl: './memb-contributions.component.html',
  styleUrl: './memb-contributions.component.css'
})
export class MembContributionsComponent implements OnInit {

  userId!: number;
  contributions: any[] = [];
  isLoading = true;

  totalPendiente: number = 0;
  totalPagado: number = 0;

  @Output() contributionPaid = new EventEmitter<{ contributionId: number, monto: number }>();

constructor(private http: HttpClient, private messageService: MessageService) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('accessToken') || '';
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  ngOnInit(): void {
    const user = JSON.parse(localStorage.getItem('currentUser')!);
    this.userId = +user.id;
    this.fetchContributions();
  }

  private normalizePagosLocales(): any {
    let raw = localStorage.getItem('pagosLocales');

    try {
      const parsed = JSON.parse(raw || '{}');
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed;
      }
      localStorage.setItem('pagosLocales', '{}');
      return {};
    } catch {
      localStorage.setItem('pagosLocales', '{}');
      return {};
    }
  }

fetchContributions(): void {
  this.isLoading = true;
  const headers = this.getAuthHeaders();
  const pagosLocales = this.normalizePagosLocales();

  this.http
    .get<any[]>(`https://opticash.duckdns.org/api/v1/member-contributions?member_id=${this.userId}`, { headers })
    .subscribe({
      next: mcListRaw => {
        const mcList = mcListRaw.filter(mc => Number(mc.memberId) === Number(this.userId));

        this.http.get<any[]>(`https://opticash.duckdns.org/api/v1/contributions`, { headers }).subscribe({
          next: allContribs => {

            this.http.get<any[]>(`https://opticash.duckdns.org/api/v1/bills`, { headers }).subscribe({
              next: bills => {

                this.contributions = mcList.map(mc => {
                  const contrib = allContribs.find(c => Number(c.id) === Number(mc.contributionId));
                  if (!contrib) return null;

                  const bill = bills.find(b => Number(b.id) === Number(contrib.billId));
                  const localPago = pagosLocales[mc.id];
                  const pagadoLocal = !!localPago;

                  const montoOriginalReal =
                    localPago?.montoOriginal ?? (mc.monto > 0 ? mc.monto : bill?.amount ?? 0);

                  const montoMostrar =
                    pagadoLocal || mc.status === 'PAGADO'
                      ? 0
                      : mc.monto > 0
                        ? mc.monto
                        : bill?.amount ?? 0;

                  return {
                    ...mc,
                    contributionId: contrib.id,
                    billId: contrib.billId,
                    descripcion: contrib.description,
                    strategy: contrib.strategy,
                    fechaLimite: contrib.dueDate,
                    billDescripcion: bill?.description,
                    status: pagadoLocal ? 'PAGADO' : mc.status,
                    montoOriginal: montoOriginalReal,
                    monto: montoMostrar
                  };
                }).filter(c => c !== null);

                this.totalPendiente = this.contributions
                  .filter(c => c.status === 'PENDIENTE')
                  .reduce((sum, c) => sum + Number(c.monto), 0);

                this.totalPagado = this.contributions
                  .filter(c => c.status === 'PAGADO')
                  .reduce((sum, c) => sum + Number(c.montoOriginal), 0);

                this.isLoading = false;
                this.showSuccess('Contribuciones cargadas', 'Tus contribuciones se han cargado correctamente.');
              },
              error: err => {
                console.error('Error cargando facturas:', err);
                this.isLoading = false;
                this.showError('Error al cargar facturas', 'Vuelve a intentar más tarde.');
              }
            });

          },
          error: err => {
            console.error('Error cargando contribuciones:', err);
            this.isLoading = false;
            this.showError('Error al cargar contribuciones', 'Vuelve a intentar más tarde.');
          }
        });

      },
      error: err => {
        console.error('Error cargando contribuciones de miembro:', err);
        this.isLoading = false;
        this.showError('Error al cargar contribuciones', 'Vuelve a intentar más tarde.');
      }
    });
}


  pagar(contribution: any): void {
  const headers = this.getAuthHeaders();
  const montoReal = Number(contribution.montoOriginal ?? contribution.monto);

 this.http.put(
  `https://opticash.duckdns.org/api/v1/member-contributions/${contribution.id}/pay`,
  { monto: montoReal },
  { headers }
).subscribe({
  next: (updatedMC: any) => {
    contribution.status = updatedMC.status;
    contribution.pagadoEn = updatedMC.pagadoEn;
    contribution.montoOriginal = updatedMC.monto;
    contribution.monto = 0;

    this.totalPendiente -= montoReal;
    this.totalPagado += montoReal;

    this.showSuccess('Pago realizado', 'El pago se realizó correctamente.');
  },
  error: err => this.showError('Error al pagar', 'No se pudo completar el pago. Vuelve a intentar.')
});

}


private showSuccess(summary: string, detail: string) {
  this.messageService.add({ severity: 'success', summary, detail });
}

private showError(summary: string, detail: string) {
  this.messageService.add({ severity: 'error', summary, detail });
}

}

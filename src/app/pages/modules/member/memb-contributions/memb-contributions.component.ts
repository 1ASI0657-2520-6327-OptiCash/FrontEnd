import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';

@Component({
  selector: 'app-memb-contributions',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    TableModule,
    ButtonModule,
    TooltipModule
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

  constructor(private http: HttpClient) {}

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
      .subscribe(mcList => {
  mcList = mcList.filter(mc => Number(mc.memberId) === Number(this.userId));

        this.http.get<any[]>(`https://opticash.duckdns.org/api/v1/contributions`, { headers })
          .subscribe(allContribs => {

            this.http.get<any[]>(`https://opticash.duckdns.org/api/v1/bills`, { headers })
              .subscribe(bills => {

                this.contributions = mcList.map(mc => {
                  const contrib = allContribs.find(c => Number(c.id) === Number(mc.contributionId));
                  if (!contrib) return null;

                  const bill = bills.find(b => Number(b.id) === Number(contrib.billId));

                  const localPago = pagosLocales[mc.id];
                  const pagadoLocal = !!localPago;

                  // reconstruimos montoOriginal real
                  const montoOriginalReal =
                    localPago?.montoOriginal ??
                    mc.monto > 0 ? mc.monto : bill?.amount ?? 0;

                  // monto a mostrar
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
              });
          });
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
    },
    error: err => console.error("Error al pagar:", err)
  });
}

}

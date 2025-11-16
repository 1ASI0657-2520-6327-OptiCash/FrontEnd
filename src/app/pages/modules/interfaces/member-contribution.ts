export interface MemberContributionResource {
  id: number;
  contributionId: number;
  memberId: number;
  monto: number;
  status: 'PENDIENTE' | 'PAGADO' | string;
  pagadoEn: string | null; // ISO date-time
}

export interface CreateContributionResource {
  billId: number;
  householdId: number;
  description: string;
  strategy: string; // por ejemplo "EQUAL" o "INCOME_BASED"
  fechaLimite: string; // formato "YYYY-MM-DD"
}

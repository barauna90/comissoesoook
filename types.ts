
export enum InstallmentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE'
}

export interface Installment {
  id: string;
  commissionId: string;
  number: number;
  totalInstallments: number;
  value: number;
  dueDate: string;
  status: InstallmentStatus;
}

export interface Commission {
  id: string;
  description: string;
  clientName: string;
  totalValue: number;
  date: string;
  installmentCount: number;
}

export interface MonthlyStats {
  month: string;
  year: number;
  totalExpected: number;
  totalReceived: number;
  totalPending: number;
}

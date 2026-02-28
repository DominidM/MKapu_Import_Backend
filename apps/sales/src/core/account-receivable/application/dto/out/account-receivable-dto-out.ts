/* ============================================
   sales/src/core/account-receivable/application/dto/out/account-receivable-dto-out.ts
   ============================================ */

// ── Response principal ────────────────────────────────────────────────────────
export class AccountReceivableResponseDto {
  id:             number;
  salesReceiptId: number;
  userRef:        string;
  totalAmount:    number;
  paidAmount:     number;
  pendingBalance: number;
  issueDate:      string;
  dueDate:        string;
  updatedAt:      string | null;
  status:         string;
  paymentTypeId:  number;
  currencyCode:   string;
  observation:    string | null;
}

// ── Response paginado ─────────────────────────────────────────────────────────
export class AccountReceivablePaginatedResponseDto {
  data:       AccountReceivableResponseDto[];
  total:      number;
  page:       number;
  limit:      number;
  totalPages: number;
}
import { CreditNote } from '../../entity/credit-note-domain-entity';
import { CreditNoteFilter } from '../../models/credit-note-filter';
import { PaginatedResult } from '../../models/paginated-result';

export interface ICreditNoteRepositoryPort {
  save(creditNote: CreditNote): Promise<CreditNote>;
  findById(noteId: number): Promise<CreditNote | null>;
  findAll(filters: CreditNoteFilter): Promise<PaginatedResult<CreditNote>>;
  findByReceiptId(receiptId: number): Promise<CreditNote[]>;
  annulById(noteId: number): Promise<void>;
  deleteById(noteId: number): Promise<void>;
  createWithTransactionLock(
    creditNote: CreditNote,
    serie: string,
  ): Promise<CreditNote>;
}

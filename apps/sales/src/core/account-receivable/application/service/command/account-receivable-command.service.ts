import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import {
  AccountReceivable,
  Money,
} from '../../../domain/entity/account-receivable-domain-entity';
import {
  IAccountReceivableRepository,
  ACCOUNT_RECEIVABLE_REPOSITORY,
} from '../../../domain/ports/out/account-receivable-port-out';
import {
  ICreateAccountReceivableUseCase,
  CreateAccountReceivableCommand,
  IApplyPaymentUseCase,
  ApplyPaymentCommand,
  ICancelAccountReceivableUseCase,
  CancelAccountReceivableCommand,
  IUpdateDueDateUseCase,
  UpdateDueDateCommand,
  ICheckExpirationUseCase,
} from '../../../domain/ports/in/account-receivable-port-in';
import { AccountReceivablePaymentOrmEntity, PaymentStatus } from '../../../infrastructure/entity/account-receivable-payment-orm.entity';

@Injectable()
export class AccountReceivableCommandService
  implements
    ICreateAccountReceivableUseCase,
    IApplyPaymentUseCase,
    ICancelAccountReceivableUseCase,
    IUpdateDueDateUseCase,
    ICheckExpirationUseCase
{
  constructor(
    @Inject(ACCOUNT_RECEIVABLE_REPOSITORY)
    private readonly repository: IAccountReceivableRepository,

    @InjectRepository(AccountReceivablePaymentOrmEntity)
    private readonly paymentRepo: Repository<AccountReceivablePaymentOrmEntity>,
  ) {}

  // ── Crear cuenta por cobrar ─────────────────────────────────────
  async create(cmd: CreateAccountReceivableCommand): Promise<AccountReceivable> {
    const account = AccountReceivable.create({
      salesReceiptId: cmd.salesReceiptId,
      userRef:        cmd.userRef,
      totalAmount:    new Money(cmd.totalAmount, cmd.currencyCode),
      dueDate:        new Date(cmd.dueDate),
      paymentTypeId:  cmd.paymentTypeId,
      currencyCode:   cmd.currencyCode,
      observation:    cmd.observation,
    });
    return this.repository.save(account);
  }

  // ── Registrar abono ─────────────────────────────────────────────
  async applyPayment(cmd: ApplyPaymentCommand): Promise<AccountReceivable> {
    const account = await this.findOrFail(cmd.accountReceivableId);
    account.applyPayment(new Money(cmd.amount, cmd.currencyCode));
    account.updatePaymentType(cmd.paymentTypeId);
    const updated = await this.repository.update(account);

    // ── Insertar registro en historial ──────────────────────────
    await this.paymentRepo.save(
      this.paymentRepo.create({
        accountReceivableId: cmd.accountReceivableId,
        amount:              cmd.amount,
        paymentTypeId:       cmd.paymentTypeId,
        referencia:          (cmd as any).referencia ?? null,
        status:              PaymentStatus.CONFIRMADO,
      }),
    );

    return updated;
  }

  // ── Cancelar ────────────────────────────────────────────────────
  async cancel(cmd: CancelAccountReceivableCommand): Promise<AccountReceivable> {
    const account = await this.findOrFail(cmd.accountReceivableId);
    account.cancel(cmd.reason);
    return this.repository.update(account);
  }

  // ── Actualizar fecha de vencimiento ─────────────────────────────
  async updateDueDate(cmd: UpdateDueDateCommand): Promise<AccountReceivable> {
    const account = await this.findOrFail(cmd.accountReceivableId);
    account.updateDueDate(new Date(cmd.newDueDate));
    return this.repository.update(account);
  }

  // ── Verificar vencimientos (cron) ───────────────────────────────
  async checkExpiration(): Promise<void> {
    const overdue = await this.repository.findOverdue();
    for (const account of overdue) {
      account.checkExpiration();
      await this.repository.update(account);
    }
  }

  // ── Helper ──────────────────────────────────────────────────────
  private async findOrFail(id: number): Promise<AccountReceivable> {
    const account = await this.repository.findById(id);
    if (!account)
      throw new NotFoundException(`AccountReceivable #${id} not found`);
    return account;
  }
}
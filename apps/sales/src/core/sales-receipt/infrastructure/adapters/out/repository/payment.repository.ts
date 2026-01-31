import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IPaymentRepositoryPort } from '../../../../domain/ports/out/payment-repository-ports-out';
import { PaymentOrmEntity } from '../../../entity/payment-orm.entity';
import { VoucherOrmEntity } from '../../../entity/voucher-orm.entity';
import { CashMovementOrmEntity } from '../../../entity/cash-movement-orm.entity';

@Injectable()
export class PaymentRepository implements IPaymentRepositoryPort {
  constructor(
    @InjectRepository(PaymentOrmEntity)
    private readonly paymentRepo: Repository<PaymentOrmEntity>,
    @InjectRepository(VoucherOrmEntity)
    private readonly voucherRepo: Repository<VoucherOrmEntity>,
    @InjectRepository(CashMovementOrmEntity)
    private readonly cashRepo: Repository<CashMovementOrmEntity>,
  ) {}

  async savePayment(data: Partial<PaymentOrmEntity>): Promise<PaymentOrmEntity> {
    // Registra el pago vinculado al comprobante (Boleta/Factura)
    return await this.paymentRepo.save(data);
  }

  async saveVoucher(data: Partial<VoucherOrmEntity>): Promise<void> {
    // Registra los datos del POS/Culqi (Solo para transacciones electrónicas)
    await this.voucherRepo.save(data);
  }

  async registerCashMovement(data: Partial<CashMovementOrmEntity>): Promise<void> {
    // Registra la entrada o salida física de dinero en la caja
    await this.cashRepo.save(data);
  }
}
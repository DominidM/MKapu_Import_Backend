import { PaymentOrmEntity } from "../../../infrastructure/entity/payment-orm.entity";
import { VoucherOrmEntity } from "../../../infrastructure/entity/voucher-orm.entity";
import { CashMovementOrmEntity } from "../../../infrastructure/entity/cash-movement-orm.entity";

export interface IPaymentRepositoryPort {
  /**
   * Registra el pago vinculado al comprobante (Boleta/Factura)
   */
  savePayment(data: Partial<PaymentOrmEntity>): Promise<PaymentOrmEntity>;

  /**
   * Guarda los datos bancarios del POS o pasarela de pago
   */
  saveVoucher(data: Partial<VoucherOrmEntity>): Promise<void>;

  /**
   * Registra el flujo de dinero físico en la caja (Efectivo)
   */
  registerCashMovement(data: Partial<CashMovementOrmEntity>): Promise<void>;
}
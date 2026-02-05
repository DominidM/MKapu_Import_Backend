/* sales/src/core/sales-receipt/application/service/sales-receipt-command.service.ts */

import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { ISalesReceiptCommandPort } from '../../domain/ports/in/sales_receipt-ports-in';
import { ISalesReceiptRepositoryPort } from '../../domain/ports/out/sales_receipt-ports-out';
import { ICustomerRepositoryPort } from '../../../customer/domain/ports/out/customer-port-out';
import { LogisticsStockProxy } from '../../infrastructure/adapters/out/TCP/logistics-stock.proxy';
import { IPaymentRepositoryPort } from '../../domain/ports/out/payment-repository-ports-out';

import { RegisterSalesReceiptDto, AnnulSalesReceiptDto } from '../dto/in';
import { SalesReceiptDeletedResponseDto } from '../dto/out';
import { SalesReceiptMapper } from '../mapper/sales-receipt.mapper';

@Injectable()
export class SalesReceiptCommandService implements ISalesReceiptCommandPort {
  constructor(
    @Inject('ISalesReceiptRepositoryPort')
    private readonly receiptRepository: ISalesReceiptRepositoryPort,

    @Inject('ICustomerRepositoryPort')
    private readonly customerRepository: ICustomerRepositoryPort,

    @Inject('IPaymentRepositoryPort')
    private readonly paymentRepository: IPaymentRepositoryPort,

    // Proxy TCP para comunicación con el microservicio de Logística
    private readonly stockProxy: LogisticsStockProxy,
  ) {}

  /**
   * Registra un nuevo comprobante de venta, gestiona pagos y actualiza stock.
   */
  async registerReceipt(dto: RegisterSalesReceiptDto): Promise<any> {
    // 1. Validaciones
    const customer = await this.customerRepository.findById(dto.customerId);
    if (!customer) throw new NotFoundException(`Cliente no existe.`);

    const assignedSerie = this.getAssignedSerie(dto.receiptTypeId);
    const nextNumber = await this.receiptRepository.getNextNumber(assignedSerie);
    const receipt = SalesReceiptMapper.fromRegisterDto({ ...dto, serie: assignedSerie }, nextNumber);
    receipt.validate();

    // 2. 🛡️ CONTROL DE STOCK (Con reversa automática)
    const processedItems = [];
    if (dto.receiptTypeId !== 3) {
      try {
        for (const item of receipt.items) {
          await this.stockProxy.registerMovement({
            productId: Number(item.productId),
            warehouseId: Number(dto.branchId),
            headquartersId: Number(dto.branchId),
            quantityDelta: -item.quantity,
            reason: 'VENTA',
          });
          processedItems.push(item);
        }
        } catch (error) {
          // Limpiamos el "Error:" duplicado para que el mensaje sea directo
          const cleanMessage = error.message.replace(/Error:/g, '').trim();
          
          await this.rollbackStock(processedItems, dto.branchId);
          throw new BadRequestException(`Stock insuficiente: ${cleanMessage}`);
        }
    }

    // 3. 💾 PERSISTENCIA DE LA VENTA
    let savedReceipt;
    try {
      savedReceipt = await this.receiptRepository.save(receipt);
    } catch (dbError) {
      await this.rollbackStock(processedItems, dto.branchId);
      throw new Error('No se pudo guardar la venta en la base de datos.');
    }

    // 4. 💵 REGISTRO EN CAJA (Ingreso manual del cajero)
    try {
      const tipoMovimiento = dto.receiptTypeId === 3 ? 'EGRESO' : 'INGRESO';

      // Guardamos el detalle del pago (Efectivo, Tarjeta, etc.)
      await this.paymentRepository.savePayment({
        idComprobante: savedReceipt.id_comprobante,
        idTipoPago: dto.paymentMethodId,
        monto: savedReceipt.total,
      });

      // Insertamos en el movimiento de caja de la sede
      await this.paymentRepository.registerCashMovement({
        idCaja: String(dto.branchId),
        idTipoPago: dto.paymentMethodId,
        tipoMov: tipoMovimiento,
        concepto: `${tipoMovimiento === 'INGRESO' ? 'VENTA' : 'DEVOLUCION'}: ${savedReceipt.getFullNumber()}`,
        monto: savedReceipt.total,
      });

    } catch (paymentError) {
      /**
       * 🚨 REVERSA TOTAL: Si el servidor falla al registrar en caja,
       * debemos anular lo anterior para que el cajero pueda reintentar
       * sin que el stock o la boleta queden duplicados.
       */
      console.error('❌ Error registrando en caja. Revirtiendo operación...');
      
      await this.rollbackStock(processedItems, dto.branchId);
      await this.receiptRepository.delete(savedReceipt.id_comprobante); // Borramos la boleta fallida
      
      throw new BadRequestException(`Error crítico de caja: La venta fue revertida. Intente de nuevo.`);
    }

    return SalesReceiptMapper.toResponseDto(savedReceipt);
  }

    if (dto.receiptTypeId !== 3) {
      console.log('➡️ [5] Intentando conectar con Logística (TCP)...'); // LOG 5
      for (const item of savedReceipt.items) {
        try {
          await this.stockProxy.registerMovement({
            productId: Number(item.productId),
            warehouseId: dto.branchId,
            headquartersId: dto.branchId,
            quantityDelta: -item.quantity,
            reason: `VENTA: ${savedReceipt.getFullNumber()}`,
          });
          console.log(`➡️ [5.1] Item ${item.productId} procesado en Logística`);
        } catch (err) {
          console.error(`❌ Error llamando a Logística:`, err);
        }
      }
    }
  }


  /**
   * Anula un comprobante existente y devuelve los productos al stock.
   */
  async annulReceipt(dto: AnnulSalesReceiptDto): Promise<any> {
    const existingReceipt = await this.receiptRepository.findById(dto.receiptId);
    if (!existingReceipt) {
      throw new NotFoundException(`Comprobante con ID ${dto.receiptId} no encontrado.`);
    }

    // Cambiar estado a ANULADO en el dominio
    const annulledReceipt = existingReceipt.anular();
    const savedReceipt = await this.receiptRepository.update(annulledReceipt);

    // Devolver productos al inventario
    for (const item of savedReceipt.items) {
      await this.stockProxy.registerMovement({
        productId: Number(item.productId),
        warehouseId: savedReceipt.id_sede_ref,
        headquartersId: savedReceipt.id_sede_ref,
        quantityDelta: item.quantity, // Valor positivo para reingreso de stock
        reason: `ANULACION: ${savedReceipt.getFullNumber()}`,
      });
    }

    return SalesReceiptMapper.toResponseDto(savedReceipt);
  }

  /**
   * Elimina físicamente un comprobante (Uso restringido).
   */
  async deleteReceipt(id: number): Promise<SalesReceiptDeletedResponseDto> {
    const existingReceipt = await this.receiptRepository.findById(id);
    if (!existingReceipt) {
      throw new NotFoundException(`Comprobante con ID ${id} no encontrado.`);
    }
    
    await this.receiptRepository.delete(id);
    
    return {
      receiptId: id,
      message: 'Comprobante eliminado correctamente de la base de datos.',
      deletedAt: new Date(),
    };
  }

  /**
   * Lógica privada para asignar series automáticas.
   */
  private getAssignedSerie(receiptTypeId: number): string {
    const seriesMap: Record<number, string> = {
      1: 'F001', // Factura
      2: 'B001', // Boleta
      3: 'NC01', // Nota de Crédito
    };
    return seriesMap[receiptTypeId] || 'T001'; // Default: Ticket
  }
}
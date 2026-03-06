import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateSaleDto } from './core/dto/create-sale.dto';
import { HttpService } from '@nestjs/axios';
import { SalesReceiptOrmEntity } from './core/sales-receipt/infrastructure/entity/sales-receipt-orm.entity';

@Injectable()
export class SalesService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly http: HttpService,
    @InjectRepository(SalesReceiptOrmEntity)
    private readonly receiptRepo: Repository<SalesReceiptOrmEntity>,
  ) {}

  async createSale(dto: CreateSaleDto) {
    return this.dataSource.transaction(async (manager) => {
      const saleResult = await manager.query(
        `INSERT INTO venta(fecha, cliente_id) VALUES (NOW(), ?)`,
        [dto.customerId],
      );
      const saleId = saleResult.insertId;

      for (const item of dto.items) {
        await manager.query(
          `INSERT INTO venta_detalle(venta_id, producto_id, cantidad, precio)
           VALUES (?, ?, ?, ?)`,
          [saleId, item.productId, item.quantity, item.price],
        );
        await this.http.axiosRef.post('http://localhost:3001/stock/movement', {
          productId:      item.productId,
          warehouseId:    item.warehouseId,
          headquartersId: item.headquartersId,
          quantityDelta:  -item.quantity,
          reason:         'VENTA',
          referenceId:    saleId,
        });
      }
      return { ok: true, saleId };
    });
  }

  // ✅ CORREGIDO — carga relaciones reales de comprobante_venta
  async getAllSales(): Promise<SalesReceiptOrmEntity[]> {
    return this.receiptRepo.find({
      relations: [
        'cliente',          // CustomerOrmEntity
        'tipoVenta',        // SalesTypeOrmEntity
        'tipoComprobante',  // ReceiptTypeOrmEntity
        'moneda',           // SunatCurrencyOrmEntity
        'details',          // SalesReceiptDetailOrmEntity
      ],
      order: { fec_emision: 'DESC' },
    });
  }
}
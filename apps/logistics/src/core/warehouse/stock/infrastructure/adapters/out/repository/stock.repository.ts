/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { StockMapper } from '../../../../application/mapper/stock.mapper';
import { Stock } from '../../../../domain/entity/stock-domain-intity';
import { StockPortsOut } from '../../../../domain/ports/out/stock-ports-out';
import { StockOrmEntity } from '../../../entity/stock-orm-intity';

@Injectable()
export class StockRepository implements StockPortsOut {
  constructor(
    @InjectRepository(StockOrmEntity)
    private readonly stockRepo: Repository<StockOrmEntity>,
  ) {}

  async updateStock(
    productId: number,
    warehouseId: number,
    headquartersId: string,
    quantity: number,
  ): Promise<void> {
    const stockExistente = await this.stockRepo.findOne({
      where: {
        id_producto: productId,
        id_almacen: warehouseId,
        id_sede: headquartersId,
      },
    });
    if (stockExistente) {
      const nuevaCantidad = Number(stockExistente.cantidad) + quantity;
      await this.stockRepo.update(stockExistente.id_stock, {
        cantidad: nuevaCantidad,
      });
    } else {
      const nuevoStock = this.stockRepo.create({
        id_producto: productId,
        id_almacen: warehouseId,
        id_sede: headquartersId,
        cantidad: quantity,
        tipo_ubicacion: 'ALMACEN',
        estado: 'DISPONIBLE',
      });
      await this.stockRepo.save(nuevoStock);
    }
  }
  async findStock(
    productId: number,
    warehouseId: number,
    headquartersId: string,
  ): Promise<Stock | null> {
    const found = await this.stockRepo.findOne({
      where: {
        id_producto: productId,
        id_almacen: warehouseId,
        id_sede: headquartersId,
      },
    });
    return found ? StockMapper.toDomain(found) : null;
  }
  async updateQuantity(stockId: number, newQuantity: number): Promise<void> {
    await this.stockRepo.update(stockId, { cantidad: newQuantity });
  }
  async create(stock: Stock): Promise<Stock> {
    const ormEntity = StockMapper.toOrm(stock);
    const saved = await this.stockRepo.save(ormEntity);
    return StockMapper.toDomain(saved);
  }
}

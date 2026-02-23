/* eslint-disable @typescript-eslint/no-unused-vars */
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { UnitPortsIn } from '../../domain/port/in/unit-ports-in';
import { Unit, UnitStatus } from '../../domain/entity/unit-domain-entity';
import { CreateUnitDto } from '../dto/in/create-unit-dto';
import { UpdateUnitDto, ChangeUnitStatusDto } from '../dto/in/update-unit-dto';
import { UnitPortsOut } from '../../domain/port/out/unit-ports-out';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TransferOrmEntity } from '../../../../warehouse/transfer/infrastructure/entity/transfer-orm.entity';

@Injectable()
export class UnitCommandService implements UnitPortsIn {
  constructor(
    @Inject('UnitPortsOut')
    private readonly unitRepo: UnitPortsOut,
    @InjectRepository(TransferOrmEntity)
    private readonly transferRepo: Repository<TransferOrmEntity>,
  ) {}
  createUnit(dto: CreateUnitDto): Promise<Unit> {
    throw new Error('Method not implemented.');
  }
  getUnitById(id: number): Promise<Unit> {
    throw new Error('Method not implemented.');
  }
  getUnitBySerial(serialNumber: string): Promise<Unit> {
    throw new Error('Method not implemented.');
  }
  listUnits(filters: {
    productId?: number;
    warehouseId?: number;
    status?: UnitStatus;
  }): Promise<Unit[]> {
    throw new Error('Method not implemented.');
  }
  updateUnit(id: number, dto: UpdateUnitDto): Promise<Unit> {
    throw new Error('Method not implemented.');
  }
  discardUnit(id: number, reason: string): Promise<Unit> {
    throw new Error('Method not implemented.');
  }
  async changeStatus(dto: ChangeUnitStatusDto): Promise<{ message: string }> {
    const units = await this.unitRepo.findBySerials(dto.series);
    if (units.length === 0) {
      throw new NotFoundException(
        'Ninguna de las series proporcionadas fue encontrada.',
      );
    }
    await this.unitRepo.updateStatusBySerials(dto.series, dto.targetStatus);

    if (dto.transferId && dto.transferStatus) {
      const result = await this.transferRepo.update(dto.transferId, {
        status: dto.transferStatus,
      });

      if (!result.affected) {
        throw new NotFoundException(
          `No se encontró la transferencia con id ${dto.transferId}.`,
        );
      }
    }

    return {
      message: `Se actualizaron ${units.length} unidades al estado ${dto.targetStatus}`,
    };
  }
}

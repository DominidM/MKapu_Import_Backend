/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* apps/logistics/src/core/warehouse/transfer/application/service/transfer-command.service.ts */

import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, QueryRunner, Repository } from 'typeorm';
import axios from 'axios';

// Puertos e Interfaces
import { TransferPortsIn } from '../../domain/ports/in/transfer-ports-in';
import { TransferPortsOut } from '../../domain/ports/out/transfer-ports-out';

// Entidades y Enums
import {
  Transfer,
  TransferItem,
  TransferStatus,
} from '../../domain/entity/transfer-domain-entity';
import { UnitStatus } from 'apps/logistics/src/core/catalog/unit/domain/entity/unit-domain-entity';
import { StockOrmEntity } from '../../../inventory/infrastructure/entity/stock-orm-intity';
import { ProductOrmEntity } from 'apps/logistics/src/core/catalog/product/infrastructure/entity/product-orm.entity';
import { StoreOrmEntity } from '../../../store/infrastructure/entity/store-orm.entity';
import { TransferOrmEntity } from '../../infrastructure/entity/transfer-orm.entity';
import { TransferDetailOrmEntity } from '../../infrastructure/entity/transfer-detail-orm.entity';

// Servicios Externos
import { TransferWebsocketGateway } from '../../infrastructure/adapters/out/transfer-websocket.gateway';
import { InventoryCommandService } from '../../../inventory/application/service/inventory-command.service';
import { UnitLockerRepository } from '../../infrastructure/adapters/out/unit-locker.repository';
import { RequestTransferDto } from '../dto/in/request-transfer.dto';
import { ApproveTransferDto } from '../dto/in/approve-transfer.dto';
import { ConfirmReceiptTransferDto } from '../dto/in/confirm-receipt-transfer.dto';
import { RejectTransferDto } from '../dto/in/reject-transfer.dto';
import {
  TransferByIdResponseDto as TransferByIdResponseOutDto,
  TransferListResponseDto as TransferListResponseOutDto,
  TransferResponseDto as TransferResponseOutDto,
} from '../dto/out';

type TransferProductDto = {
  id_producto: number;
  categoria: Array<{
    id_categoria: number;
    nombre: string;
  }>;
  codigo: string;
  anexo: string;
  descripcion: string;
};

type TransferCreatorUserDto = {
  idUsuario: number;
  usuNom: string;
  apePat: string;
};

type TransferItemResponseDto = Omit<TransferItem, 'productId'> & {
  producto: TransferProductDto[];
};

type TransferBaseResponseDto = {
  id?: number;
  originHeadquartersId: string;
  originWarehouseId: number;
  destinationHeadquartersId: string;
  destinationWarehouseId: number;
  totalQuantity: number;
  status: TransferStatus;
  observation?: string;
  requestDate: Date;
  responseDate?: Date;
  completionDate?: Date;
};

type TransferResponseDto = TransferBaseResponseDto & {
  items: TransferItemResponseDto[];
  creatorUser: TransferCreatorUserDto[];
};

type TransferHeadquarterDto = {
  id_sede: number;
  nombre: string;
};

type TransferListResponseDto = {
  id?: number;
  origin: {
    id_sede: string;
    nomSede: string;
  };
  destination: {
    id_sede: string;
    nomSede: string;
  };
  totalQuantity: number;
  status: TransferStatus;
  observation?: string;
  nomProducto: string;
  creatorUser: TransferCreatorUserDto | null;
};

type TransferByIdProductDto = {
  id_producto: number;
  categoria: {
    id_categoria: number;
    nombre: string;
  } | null;
  codigo: string;
  nomProducto: string;
  descripcion: string;
};

type TransferByIdItemResponseDto = {
  series: string[];
  quantity: number;
  producto: TransferByIdProductDto | null;
};

type TransferByIdResponseDto = {
  id?: number;
  origin: {
    id_sede: string;
    nomSede: string;
  };
  originWarehouse: {
    id_almacen: number;
    nomAlm: string;
  };
  destination: {
    id_sede: string;
    nomSede: string;
  };
  destinationWarehouse: {
    id_almacen: number;
    nomAlm: string;
  };
  totalQuantity: number;
  status: TransferStatus;
  observation?: string;
  requestDate: Date;
  items: TransferByIdItemResponseDto[];
  creatorUser: TransferCreatorUserDto | null;
};

@Injectable()
export class TransferCommandService implements TransferPortsIn {
  constructor(
    @Inject('TransferPortsOut')
    private readonly transferRepo: TransferPortsOut,
    private readonly dataSource: DataSource,
    private readonly unitLockerRepository: UnitLockerRepository,
    private readonly transferGateway: TransferWebsocketGateway,
    @InjectRepository(StockOrmEntity)
    private readonly stockRepo: Repository<StockOrmEntity>,
    @InjectRepository(ProductOrmEntity)
    private readonly productRepo: Repository<ProductOrmEntity>,
    @InjectRepository(StoreOrmEntity)
    private readonly storeRepo: Repository<StoreOrmEntity>,
    private readonly inventoryService: InventoryCommandService,
  ) {}

  async requestTransfer(dto: RequestTransferDto): Promise<TransferResponseOutDto> {
    const allSeries = dto.items.flatMap((item) => item.series);
    const uniqueSeries = new Set(allSeries);
    if (uniqueSeries.size !== allSeries.length) {
      throw new BadRequestException(
        'La solicitud contiene series duplicadas en los items.',
      );
    }

    const postCommitEvents: Array<() => void> = [];

    const savedTransfer = await this.dataSource.transaction(async (manager) => {
      await this.validateWarehouseBelongsToHeadquarters(
        dto.originWarehouseId,
        dto.originHeadquartersId,
        manager,
      );
      await this.validateWarehouseBelongsToHeadquarters(
        dto.destinationWarehouseId,
        dto.destinationHeadquartersId,
        manager,
      );

      const transferMetadata = manager.getRepository(TransferOrmEntity).metadata;
      if (!transferMetadata.relations.some((relation) => relation.propertyName === 'details')) {
        throw new UnprocessableEntityException(
          'El esquema actual no permite asociar series a la transferencia.',
        );
      }

      const lockedUnits =
        await this.unitLockerRepository.fetchUnitsBySeriesForUpdate(
          allSeries,
          manager,
        );

      if (lockedUnits.length !== allSeries.length) {
        throw new BadRequestException(
          'Algunas series no existen para la transferencia.',
        );
      }

      const seriesToProductMap = new Map<string, number>();
      dto.items.forEach((item) => {
        item.series.forEach((serie) => seriesToProductMap.set(serie, item.productId));
      });

      const invalidUnits = lockedUnits.filter((unit) => {
        const expectedProductId = Number(seriesToProductMap.get(unit.serie));
        return (
          unit.estado !== UnitStatus.AVAILABLE ||
          unit.id_almacen !== dto.originWarehouseId ||
          unit.id_producto !== expectedProductId
        );
      });

      if (invalidUnits.length > 0) {
        const invalidDetails = invalidUnits.map((unit) => {
          const expectedProductId = Number(seriesToProductMap.get(unit.serie));
          const reasons: string[] = [];

          if (unit.estado !== UnitStatus.AVAILABLE) {
            reasons.push(`estado=${unit.estado}`);
          }
          if (unit.id_almacen !== dto.originWarehouseId) {
            reasons.push(
              `almacen=${unit.id_almacen} (esperado=${dto.originWarehouseId})`,
            );
          }
          if (unit.id_producto !== expectedProductId) {
            reasons.push(
              `producto=${unit.id_producto} (esperado=${expectedProductId})`,
            );
          }

          return `${unit.serie}: ${reasons.join(', ')}`;
        });

        throw new BadRequestException(
          `Series inválidas para transferencia: ${invalidDetails.join(' | ')}`,
        );
      }

      const transfer = new Transfer(
        dto.originHeadquartersId,
        dto.originWarehouseId,
        dto.destinationHeadquartersId,
        dto.destinationWarehouseId,
        dto.items.map((item) => new TransferItem(item.productId, item.series)),
        dto.observation,
        undefined,
        dto.userId,
        TransferStatus.REQUESTED,
      );

      const createdTransfer = await this.transferRepo.save(transfer, manager);

      postCommitEvents.push(() => {
        this.transferGateway.notifyNewRequest(dto.destinationHeadquartersId, {
          id: createdTransfer.id,
          origin: dto.originHeadquartersId,
          date: createdTransfer.requestDate,
        });
      });

      return createdTransfer;
    });

    postCommitEvents.forEach((event) => event());
    return savedTransfer;
  }

  async approveTransfer(
    transferId: number,
    dto: ApproveTransferDto,
  ): Promise<TransferResponseOutDto> {
    const postCommitEvents: Array<() => void> = [];

    const savedTransfer = await this.dataSource.transaction(async (manager) => {
      const transfer = await this.transferRepo.findById(transferId);
      if (!transfer) throw new NotFoundException('Transferencia no encontrada');

      const transferOrm = await manager
        .getRepository(TransferOrmEntity)
        .createQueryBuilder('transfer')
        .where('transfer.id = :id', { id: transferId })
        .setLock('pessimistic_write')
        .getOne();
      if (!transferOrm) {
        throw new NotFoundException('Transferencia no encontrada');
      }
      if (transferOrm.status !== TransferStatus.REQUESTED) {
        throw new ConflictException(
          'Solo se puede aprobar una transferencia SOLICITADA.',
        );
      }

      const allSeries = transfer.items.flatMap((item) => item.series);
      await this.validateSeriesAvailableForTransfer(transfer, allSeries, manager);

      for (const item of transfer.items) {
        const stockDisponible = await this.inventoryService.getStockLevel(
          item.productId,
          transfer.originWarehouseId,
        );
        if (stockDisponible < item.quantity) {
          throw new ConflictException(
            `Stock insuficiente para el producto ${item.productId}.`,
          );
        }
      }

      transfer.approve();
      transfer.creatorUserId = dto.userId;
      const updatedTransfer = await this.transferRepo.save(transfer, manager);
      await this.unitLockerRepository.markUnitsTransferred(allSeries, manager);

      postCommitEvents.push(() => {
        this.transferGateway.notifyStatusChange(transfer.originHeadquartersId, {
          id: updatedTransfer.id,
          status: TransferStatus.APPROVED,
        });
        this.transferGateway.notifyStatusChange(
          transfer.destinationHeadquartersId,
          {
            id: updatedTransfer.id,
            status: TransferStatus.APPROVED,
          },
        );
      });

      return updatedTransfer;
    });

    postCommitEvents.forEach((event) => event());
    return savedTransfer;
  }

  async confirmReceipt(
    transferId: number,
    dto: ConfirmReceiptTransferDto,
  ): Promise<TransferResponseOutDto> {
    const postCommitEvents: Array<() => void> = [];
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    let savedTransfer: Transfer | null = null;
    try {
      const transfer = await this.lockAndLoadTransfer(transferId, queryRunner);
      if (transfer.status !== TransferStatus.APPROVED) {
        throw new ConflictException(
          'Solo se puede confirmar recepción de transferencias APROBADAS.',
        );
      }

      const allSeries = transfer.items.flatMap((item) => item.series);
      const units = await this.unitLockerRepository.fetchUnitsBySeriesForUpdate(
        allSeries,
        queryRunner.manager,
      );
      if (units.length !== allSeries.length) {
        throw new ConflictException(
          'Transferencia incompleta: faltan series asociadas para confirmar recepción.',
        );
      }
      const invalidUnits = units.filter(
        (unit) =>
          unit.estado !== UnitStatus.TRANSFERRING ||
          unit.id_almacen !== transfer.originWarehouseId,
      );
      if (invalidUnits.length > 0) {
        throw new ConflictException(
          'Transferencia incompleta: existen series que no están en estado TRANSFERIDO.',
        );
      }

      await this.unitLockerRepository.moveToDestinationAndRelease(
        allSeries,
        transfer.destinationHeadquartersId,
        transfer.destinationWarehouseId,
        queryRunner.manager,
      );

      const groupedMap = new Map<number, number>();
      transfer.items.forEach((item) => {
        const current = groupedMap.get(item.productId) || 0;
        groupedMap.set(item.productId, current + item.quantity);
      });
      const groupedItems = Array.from(groupedMap.entries()).map(
        ([productId, quantity]) => ({
          productId,
          quantity,
        }),
      );
      await this.inventoryService.registerMovementFromTransfer(
        queryRunner.manager,
        {
          transferId: transfer.id!,
          originWarehouseId: transfer.originWarehouseId,
          destinationWarehouseId: transfer.destinationWarehouseId,
          originHeadquartersId: transfer.originHeadquartersId,
          destinationHeadquartersId: transfer.destinationHeadquartersId,
          groupedItems,
          observation: `Confirmación de recepción de transferencia #${transfer.id} por usuario ${dto.userId}`,
        },
      );

      transfer.complete();
      transfer.creatorUserId = dto.userId;
      savedTransfer = await this.transferRepo.save(transfer, queryRunner.manager);

      await queryRunner.commitTransaction();

      postCommitEvents.push(() => {
        this.transferGateway.notifyStatusChange(transfer.originHeadquartersId, {
          id: savedTransfer?.id,
          status: TransferStatus.COMPLETED,
        });
        this.transferGateway.notifyStatusChange(
          transfer.destinationHeadquartersId,
          {
            id: savedTransfer?.id,
            status: TransferStatus.COMPLETED,
          },
        );
      });
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }

    postCommitEvents.forEach((event) => event());
    if (!savedTransfer) {
      throw new NotFoundException('Transferencia no encontrada');
    }
    return savedTransfer;
  }

  async rejectTransfer(
    transferId: number,
    dto: RejectTransferDto,
  ): Promise<TransferResponseOutDto> {
    const postCommitEvents: Array<() => void> = [];

    const savedTransfer = await this.dataSource.transaction(async (manager) => {
      const transfer = await this.transferRepo.findById(transferId);
      if (!transfer) throw new NotFoundException('Transferencia no encontrada');
      if (
        transfer.status !== TransferStatus.REQUESTED &&
        transfer.status !== TransferStatus.APPROVED
      ) {
        throw new ConflictException(
          'Solo se puede rechazar transferencias SOLICITADAS o APROBADAS.',
        );
      }

      const allSeries = transfer.items.flatMap((item) => item.series);
      await this.unitLockerRepository.fetchUnitsBySeriesForUpdate(
        allSeries,
        manager,
      );

      transfer.reject(dto.reason);
      transfer.creatorUserId = dto.userId;
      const updatedTransfer = await this.transferRepo.save(transfer, manager);

      await this.unitLockerRepository.releaseUnits(allSeries, manager);

      postCommitEvents.push(() => {
        this.transferGateway.notifyStatusChange(transfer.originHeadquartersId, {
          id: updatedTransfer.id,
          status: TransferStatus.REJECTED,
          reason: dto.reason,
        });
        this.transferGateway.notifyStatusChange(
          transfer.destinationHeadquartersId,
          {
            id: updatedTransfer.id,
            status: TransferStatus.REJECTED,
            reason: dto.reason,
          },
        );
      });

      return updatedTransfer;
    });

    postCommitEvents.forEach((event) => event());
    return savedTransfer;
  }

  // --- Métodos de Consulta ---

  getTransfersByHeadquarters(
    headquartersId: string,
  ): Promise<TransferResponseOutDto[]> {
    return this.transferRepo.findByHeadquarters(headquartersId);
  }

  async getTransferById(id: number): Promise<TransferByIdResponseOutDto> {
    const transfer = await this.transferRepo.findById(id);
    if (!transfer) throw new NotFoundException('Transferencia no encontrada');
    try {
      return this.buildTransferByIdResponse(
        transfer,
        new Map<number, TransferProductDto | null>(),
        new Map<string, TransferHeadquarterDto | null>(),
        new Map<number, { id_almacen: number; nombre: string | null } | null>(),
      );
    } catch (error: any) {
      console.error(
        `[TransferDebug][getTransferById] transferId=${id} build response failed: ${error?.message}`,
      );
      throw error;
    }
  }

  async getAllTransfers(): Promise<TransferListResponseOutDto[]> {
    const transfers = await this.transferRepo.findAll();
    const productCache = new Map<number, TransferProductDto | null>();
    const userCache = new Map<number, TransferCreatorUserDto | null>();
    const headquarterCache = new Map<string, TransferHeadquarterDto | null>();

    const response = await Promise.all(
      transfers.map(async (transfer) => {
        try {
          return await this.buildTransferListResponse(
            transfer,
            productCache,
            userCache,
            headquarterCache,
          );
        } catch (error: any) {
          console.error(
            `[TransferDebug][getAllTransfers] transferId=${transfer.id} build response failed: ${error?.message}`,
          );
          return {
            id: transfer.id,
            origin: {
              id_sede: String(transfer.originHeadquartersId ?? ''),
              nomSede: `Sede ${String(transfer.originHeadquartersId ?? '')}`,
            },
            destination: {
              id_sede: String(transfer.destinationHeadquartersId ?? ''),
              nomSede: `Sede ${String(transfer.destinationHeadquartersId ?? '')}`,
            },
            totalQuantity: transfer.totalQuantity,
            status: transfer.status,
            observation: transfer.observation,
            nomProducto: '',
            creatorUser: null,
          } satisfies TransferListResponseDto;
        }
      }),
    );

    return response;
  }

  // --- Validaciones Auxiliares ---

  private async validateWarehouseBelongsToHeadquarters(
    warehouseId: number,
    headquartersId: string,
    manager?: EntityManager,
  ): Promise<void> {
    const stockRepository = manager
      ? manager.getRepository(StockOrmEntity)
      : this.stockRepo;
    const relation = await stockRepository.findOne({
      where: {
        id_almacen: warehouseId,
        id_sede: headquartersId as any,
      },
    });

    if (!relation) {
      throw new BadRequestException(
        `El almacén ${warehouseId} no pertenece a la sede ${headquartersId}`,
      );
    }
  }

  private async validateSeriesAvailableForTransfer(
    transfer: Transfer,
    allSeries: string[],
    manager: EntityManager,
  ): Promise<void> {
    const lockedUnits = await this.unitLockerRepository.fetchUnitsBySeriesForUpdate(
      allSeries,
      manager,
    );
    if (lockedUnits.length !== allSeries.length) {
      throw new ConflictException(
        'Algunas series no existen para la transferencia aprobada.',
      );
    }

    const seriesToProductMap = new Map<string, number>();
    transfer.items.forEach((item) => {
      item.series.forEach((serie) => seriesToProductMap.set(serie, item.productId));
    });

    const invalidUnits = lockedUnits.filter((unit) => {
      const expectedProductId = Number(seriesToProductMap.get(unit.serie));
      return (
        unit.estado !== UnitStatus.AVAILABLE ||
        unit.id_almacen !== transfer.originWarehouseId ||
        unit.id_producto !== expectedProductId
      );
    });

    if (invalidUnits.length > 0) {
      throw new ConflictException(
        'Conflicto de series: una o más series ya no están DISPONIBLE o no corresponden al origen.',
      );
    }
  }

  private async lockAndLoadTransfer(
    transferId: number,
    queryRunner: QueryRunner,
  ): Promise<Transfer> {
    const transferOrm = await queryRunner.manager
      .getRepository(TransferOrmEntity)
      .createQueryBuilder('transfer')
      .leftJoinAndSelect('transfer.details', 'details')
      .where('transfer.id = :transferId', { transferId })
      .setLock('pessimistic_write')
      .getOne();

    if (!transferOrm) {
      throw new NotFoundException('Transferencia no encontrada');
    }

    const details = transferOrm.details ?? [];
    if (details.length === 0) {
      throw new ConflictException(
        'La transferencia no contiene detalle de series para confirmar recepción.',
      );
    }

    const originHeadquarterId = await this.getHeadquartersByWarehouseId(
      queryRunner.manager,
      transferOrm.originWarehouseId,
    );
    const destinationHeadquarterId = await this.getHeadquartersByWarehouseId(
      queryRunner.manager,
      transferOrm.destinationWarehouseId,
    );

    const grouped = new Map<number, string[]>();
    details.forEach((detail: TransferDetailOrmEntity) => {
      const productSeries = grouped.get(detail.productId) || [];
      productSeries.push(detail.serialNumber);
      grouped.set(detail.productId, productSeries);
    });

    const items: TransferItem[] = Array.from(grouped.entries()).map(
      ([productId, series]) => new TransferItem(productId, series),
    );

    return new Transfer(
      originHeadquarterId,
      transferOrm.originWarehouseId,
      destinationHeadquarterId,
      transferOrm.destinationWarehouseId,
      items,
      transferOrm.motive,
      transferOrm.id,
      undefined,
      transferOrm.status as TransferStatus,
      transferOrm.date,
    );
  }

  private async getHeadquartersByWarehouseId(
    manager: EntityManager,
    warehouseId: number,
  ): Promise<string> {
    const stock = await manager.getRepository(StockOrmEntity).findOne({
      where: { id_almacen: warehouseId },
      select: ['id_sede'],
    });

    if (!stock?.id_sede) {
      throw new BadRequestException(
        `No se encontró la sede para el almacén ${warehouseId}.`,
      );
    }
    return stock.id_sede;
  }

  private async getUserById(
    id: number,
  ): Promise<{ id_usuario: number; usu_nom: string; ape_pat: string } | null> {
    const baseUrls: string[] = [];
    if (process.env.ADMIN_SERVICE_URL) {
      baseUrls.push(process.env.ADMIN_SERVICE_URL);
    }
    if (process.env.API_GATEWAY_URL) {
      baseUrls.push(`${process.env.API_GATEWAY_URL}/admin`);
    }
    baseUrls.push(
      'http://localhost:3002',
      'http://admin_service:3002',
      'http://localhost:3000/admin',
      'http://api-gateway:3000/admin',
    );

    for (const baseUrl of baseUrls) {
      try {
        const response = await axios.get(`${baseUrl}/users/${id}`, {
          timeout: 5000,
        });

        const data = response?.data;
        if (!data?.id_usuario) {
          console.log(
            `[TransferDebug][getUserById] No id_usuario from ${baseUrl}/users/${id}`,
          );
          continue;
        }

        console.log(
          `[TransferDebug][getUserById] Found user id=${id} via ${baseUrl}`,
        );

        return {
          id_usuario: data.id_usuario,
          usu_nom: data.usu_nom,
          ape_pat: data.ape_pat,
        };
      } catch (error: any) {
        console.error(
          `[TransferDebug][getUserById] Failed ${baseUrl}/users/${id}: ${error?.message}`,
        );
        continue;
      }
    }

    console.log(`[TransferDebug][getUserById] User not resolved for id=${id}`);
    return null;
  }

  private async getProductById(id: number): Promise<TransferProductDto | null> {
    if (!id || Number.isNaN(id)) return null;
    let product: ProductOrmEntity | null = null;
    try {
      product = await this.productRepo.findOne({
        where: { id_producto: id },
        relations: ['categoria'],
      });
    } catch (error: any) {
      console.error(
        `[TransferDebug][getProductById] Failed for id=${id}: ${error?.message}`,
      );
      return null;
    }

    if (!product) return null;

    return {
      id_producto: product.id_producto,
      categoria:
        product.categoria
          ? [
              {
                id_categoria: product.categoria.id_categoria,
                nombre: product.categoria.nombre,
              },
            ]
          : [],
      codigo: product.codigo,
      anexo: product.anexo,
      descripcion: product.descripcion,
    };
  }

  private async getHeadquarterById(
    id: string,
  ): Promise<TransferHeadquarterDto | null> {
    const headquartersId = String(id ?? '').trim();
    if (!headquartersId) return null;

    const baseUrls: string[] = [];
    if (process.env.ADMIN_SERVICE_URL) {
      baseUrls.push(process.env.ADMIN_SERVICE_URL);
    }
    if (process.env.API_GATEWAY_URL) {
      baseUrls.push(`${process.env.API_GATEWAY_URL}/admin`);
    }
    baseUrls.push(
      'http://localhost:3002',
      'http://admin_service:3002',
      'http://localhost:3000/admin',
      'http://api-gateway:3000/admin',
    );

    for (const baseUrl of baseUrls) {
      try {
        const response = await axios.get(`${baseUrl}/headquarters/${headquartersId}`, {
          timeout: 5000,
        });

        const data = response?.data;
        if (!data?.id_sede) {
          continue;
        }

        return {
          id_sede: data.id_sede,
          nombre: data.nombre,
        };
      } catch {
        continue;
      }
    }

    return null;
  }

  private async getStoreById(
    id: number,
  ): Promise<{ id_almacen: number; nombre: string | null } | null> {
    if (!id || Number.isNaN(id)) return null;
    let store: StoreOrmEntity | null = null;
    try {
      store = await this.storeRepo.findOne({
        where: { id_almacen: id },
        select: ['id_almacen', 'nombre'],
      });
    } catch (error: any) {
      console.error(
        `[TransferDebug][getStoreById] Failed for id=${id}: ${error?.message}`,
      );
      return null;
    }

    if (!store) return null;
    return {
      id_almacen: store.id_almacen,
      nombre: store.nombre,
    };
  }

  private async buildTransferListResponse(
    transfer: Transfer,
    productCache: Map<number, TransferProductDto | null>,
    userCache: Map<number, TransferCreatorUserDto | null>,
    headquarterCache: Map<string, TransferHeadquarterDto | null>,
  ): Promise<TransferListResponseDto> {
    const originHeadquartersId = String(transfer.originHeadquartersId ?? '');
    const destinationHeadquartersId = String(transfer.destinationHeadquartersId ?? '');

    let originHeadquarter = headquarterCache.get(originHeadquartersId);
    if (originHeadquarter === undefined) {
      originHeadquarter = await this.getHeadquarterById(originHeadquartersId);
      headquarterCache.set(originHeadquartersId, originHeadquarter);
    }

    let destinationHeadquarter = headquarterCache.get(destinationHeadquartersId);
    if (destinationHeadquarter === undefined) {
      destinationHeadquarter = await this.getHeadquarterById(destinationHeadquartersId);
      headquarterCache.set(destinationHeadquartersId, destinationHeadquarter);
    }

    let creatorUser: TransferCreatorUserDto | null = null;
    if (transfer.creatorUserId) {
      creatorUser = userCache.get(transfer.creatorUserId) ?? null;

      if (!userCache.has(transfer.creatorUserId)) {
        const user = await this.getUserById(transfer.creatorUserId);
        creatorUser = user
          ? {
              idUsuario: user.id_usuario,
              usuNom: user.usu_nom,
              apePat: user.ape_pat,
            }
          : null;
        userCache.set(transfer.creatorUserId, creatorUser);
      }
    }

    const firstItem = (transfer.items ?? [])[0];
    let nomProducto = '';

    if (firstItem?.productId) {
      const productId = Number(firstItem.productId);
      let productData = productCache.get(productId);

      if (productData === undefined) {
        productData = await this.getProductById(productId);
        productCache.set(productId, productData);
      }

      nomProducto =
        productData?.anexo?.trim() ||
        productData?.descripcion?.trim() ||
        productData?.codigo?.trim() ||
        '';
    }

    return {
      id: transfer.id,
      origin: {
        id_sede: originHeadquartersId,
        nomSede: originHeadquarter?.nombre ?? `Sede ${originHeadquartersId}`,
      },
      destination: {
        id_sede: destinationHeadquartersId,
        nomSede:
          destinationHeadquarter?.nombre ??
          `Sede ${destinationHeadquartersId}`,
      },
      totalQuantity: transfer.totalQuantity,
      status: transfer.status,
      observation: transfer.observation,
      nomProducto,
      creatorUser,
    };
  }

  private async buildTransferByIdResponse(
    transfer: Transfer,
    productCache: Map<number, TransferProductDto | null>,
    headquarterCache: Map<string, TransferHeadquarterDto | null>,
    storeCache: Map<number, { id_almacen: number; nombre: string | null } | null>,
  ): Promise<TransferByIdResponseDto> {
    const originHeadquartersId = String(transfer.originHeadquartersId ?? '');
    const destinationHeadquartersId = String(transfer.destinationHeadquartersId ?? '');

    let originHeadquarter = headquarterCache.get(originHeadquartersId);
    if (originHeadquarter === undefined) {
      originHeadquarter = await this.getHeadquarterById(originHeadquartersId);
      headquarterCache.set(originHeadquartersId, originHeadquarter);
    }

    let destinationHeadquarter = headquarterCache.get(destinationHeadquartersId);
    if (destinationHeadquarter === undefined) {
      destinationHeadquarter = await this.getHeadquarterById(destinationHeadquartersId);
      headquarterCache.set(destinationHeadquartersId, destinationHeadquarter);
    }

    let originStore = storeCache.get(transfer.originWarehouseId);
    if (originStore === undefined) {
      originStore = await this.getStoreById(transfer.originWarehouseId);
      storeCache.set(transfer.originWarehouseId, originStore);
    }

    let destinationStore = storeCache.get(transfer.destinationWarehouseId);
    if (destinationStore === undefined) {
      destinationStore = await this.getStoreById(transfer.destinationWarehouseId);
      storeCache.set(transfer.destinationWarehouseId, destinationStore);
    }

    let creatorUser: TransferCreatorUserDto | null = null;
    if (transfer.creatorUserId) {
      const user = await this.getUserById(transfer.creatorUserId);
      if (user) {
        creatorUser = {
          idUsuario: user.id_usuario,
          usuNom: user.usu_nom,
          apePat: user.ape_pat,
        };
      }
    }

    const items = await Promise.all(
      (transfer.items ?? []).map(async (item) => {
        const productId = Number(item.productId);
        let productData = productCache.get(productId);

        if (productData === undefined) {
          productData = await this.getProductById(productId);
          productCache.set(productId, productData);
        }

        return {
          series: item.series,
          quantity: item.quantity,
          producto: productData
            ? {
                id_producto: productData.id_producto,
                categoria:
                  productData.categoria.length > 0
                    ? {
                        id_categoria: productData.categoria[0].id_categoria,
                        nombre: productData.categoria[0].nombre,
                      }
                    : null,
                codigo: productData.codigo,
                nomProducto: productData.anexo,
                descripcion: productData.descripcion,
              }
            : null,
        };
      }),
    );

    return {
      id: transfer.id,
      origin: {
        id_sede: originHeadquartersId,
        nomSede: originHeadquarter?.nombre ?? `Sede ${originHeadquartersId}`,
      },
      originWarehouse: {
        id_almacen: transfer.originWarehouseId,
        nomAlm:
          originStore?.nombre ?? `Almacén ${String(transfer.originWarehouseId)}`,
      },
      destination: {
        id_sede: destinationHeadquartersId,
        nomSede:
          destinationHeadquarter?.nombre ??
          `Sede ${destinationHeadquartersId}`,
      },
      destinationWarehouse: {
        id_almacen: transfer.destinationWarehouseId,
        nomAlm:
          destinationStore?.nombre ??
          `Almacén ${String(transfer.destinationWarehouseId)}`,
      },
      totalQuantity: transfer.totalQuantity,
      status: transfer.status,
      observation: transfer.observation,
      requestDate: transfer.requestDate,
      items,
      creatorUser,
    };
  }

  private async buildTransferResponse(
    transfer: Transfer,
    productCache?: Map<number, TransferProductDto | null>,
  ): Promise<TransferResponseDto> {
    let creatorUser: TransferCreatorUserDto[] = [];

    if (transfer.creatorUserId) {
      const user = await this.getUserById(transfer.creatorUserId);
      if (user) {
        creatorUser = [
          {
            idUsuario: user.id_usuario,
            usuNom: user.usu_nom,
            apePat: user.ape_pat,
          },
        ];
      } else {
        console.log(
          `[TransferDebug][buildTransferResponse] creatorUser unresolved for transferId=${transfer.id}, creatorUserId=${transfer.creatorUserId}`,
        );
      }
    } else {
      console.log(
        `[TransferDebug][buildTransferResponse] transferId=${transfer.id} without creatorUserId`,
      );
    }

    const cache = productCache ?? new Map<number, TransferProductDto | null>();

    const items = await Promise.all(
      (transfer.items ?? []).map(async (item) => {
        const productId = Number(item.productId);
        let productData = cache.get(productId);

        if (productData === undefined) {
          productData = await this.getProductById(productId);
          cache.set(productId, productData);
        }

        const itemWithoutProductId: Omit<TransferItem, 'productId'> = {
          series: item.series,
          quantity: item.quantity,
        };
        return {
          ...itemWithoutProductId,
          producto: productData ? [productData] : [],
        };
      }),
    );

    const rest: TransferBaseResponseDto = {
      id: transfer.id,
      originHeadquartersId: transfer.originHeadquartersId,
      originWarehouseId: transfer.originWarehouseId,
      destinationHeadquartersId: transfer.destinationHeadquartersId,
      destinationWarehouseId: transfer.destinationWarehouseId,
      totalQuantity: transfer.totalQuantity,
      status: transfer.status,
      observation: transfer.observation,
      requestDate: transfer.requestDate,
      responseDate: transfer.responseDate,
      completionDate: transfer.completionDate,
    };

    return {
      ...rest,
      items,
      creatorUser,
    };
  }
}

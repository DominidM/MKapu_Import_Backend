/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* apps/logistics/src/core/warehouse/transfer/application/service/transfer-command.service.ts */

import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import axios from 'axios';

// Puertos e Interfaces
import { UnitPortsOut } from 'apps/logistics/src/core/catalog/unit/domain/port/out/unit-ports-out';
import {
  RequestTransferDto,
  TransferPortsIn,
} from '../../domain/ports/in/transfer-ports-in';
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

// Servicios Externos
import { TransferWebsocketGateway } from '../../infrastructure/adapters/out/transfer-websocket.gateway';
import { InventoryCommandService } from '../../../inventory/application/service/inventory-command.service';

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
    @Inject('UnitPortsOut')
    private readonly unitRepo: UnitPortsOut,
    private readonly transferGateway: TransferWebsocketGateway,
    @InjectRepository(StockOrmEntity)
    private readonly stockRepo: Repository<StockOrmEntity>,
    @InjectRepository(ProductOrmEntity)
    private readonly productRepo: Repository<ProductOrmEntity>,
    @InjectRepository(StoreOrmEntity)
    private readonly storeRepo: Repository<StoreOrmEntity>,
    private readonly inventoryService: InventoryCommandService,
  ) {}

  async requestTransfer(dto: RequestTransferDto): Promise<Transfer> {
    // 1. Validar que los almacenes pertenezcan a las sedes indicadas
    await this.validateWarehouseBelongsToHeadquarters(
      dto.originWarehouseId,
      dto.originHeadquartersId,
    );

    await this.validateWarehouseBelongsToHeadquarters(
      dto.destinationWarehouseId,
      dto.destinationHeadquartersId,
    );

    // 2. Validar existencia de series
    const allSeries = dto.items.flatMap((item) => item.series);
    const foundUnits = await this.unitRepo.findBySerials(allSeries);

    if (foundUnits.length !== allSeries.length) {
      throw new NotFoundException(
        'Algunas series no existen en la base de datos.',
      );
    }
    const seriesToProductMap = new Map();
    dto.items.forEach((item) => {
      item.series.forEach((serie) =>
        seriesToProductMap.set(serie, item.productId),
      );
    });
    const invalidUnits = foundUnits.filter((u: any) => {
      const currentStatus = String(u.status || u.estado || '').toUpperCase();
      const currentWarehouseId = Number(u.warehouseId || u.id_almacen);
      const targetWarehouseId = Number(dto.originWarehouseId);

      const unitSerial = u.serialNumber || u.serie || u.series;
      const realProductId = Number(u.productId || u.id_producto);
      const expectedProductId = Number(seriesToProductMap.get(unitSerial));
      const isCorrectProduct = realProductId === expectedProductId;
      const isAvailable = currentStatus === 'DISPONIBLE' || currentStatus === '1';
      const isInOrigin = currentWarehouseId === targetWarehouseId;
      if (!isAvailable || !isInOrigin || !isCorrectProduct) {
         console.log(`FALLO EN SERIE: ${unitSerial}`);
         console.log(`- Disponible? ${isAvailable} (${currentStatus})`);
         console.log(`- En Origen? ${isInOrigin} (Unit: ${currentWarehouseId} vs DTO: ${targetWarehouseId})`);
         console.log(`- Producto Correcto? ${isCorrectProduct} (Real: ${realProductId} vs Esperado: ${expectedProductId})`);
      }
      
      return !isAvailable || !isInOrigin || !isCorrectProduct;
    });
    if (invalidUnits.length > 0) {
      console.log('--- FALLO DE VALIDACIÓN ---');
      console.log(
        'Status Detectado:',
        String(foundUnits[0].status || foundUnits[0].status).toUpperCase(),
      );
      console.log(
        'Almacén Detectado:',
        Number(foundUnits[0].warehouseId || foundUnits[0].warehouseId),
      );
      console.log('--- VS ESPERADO ---');
      console.log('Status Esperado: AVAILABLE o 1');
      console.log('Almacén Esperado:', Number(dto.originWarehouseId));

      throw new BadRequestException(
        'Series no disponibles en el almacén de origen.',
      );
    }

    // 4. Crear instancia de Transferencia
    const transferItems = dto.items.map(
      (i) => new TransferItem(i.productId, i.series),
    );

    const transfer = new Transfer(
      dto.originHeadquartersId,
      dto.originWarehouseId,
      dto.destinationHeadquartersId,
      dto.destinationWarehouseId,
      transferItems,
      dto.observation,
      undefined,
      dto.userId,
      TransferStatus.REQUESTED,
    );

    // 5. Persistir Transferencia
    const savedTransfer = await this.transferRepo.save(transfer);

    // 6. Bloquear unidades (Estado TRANSFERRING)
    await Promise.all(
      allSeries.map((serie) =>
        this.unitRepo.updateStatusBySerial(serie, UnitStatus.TRANSFERRING),
      ),
    );

    // 7. Notificación en tiempo real
    this.transferGateway.notifyNewRequest(dto.destinationHeadquartersId, {
      id: savedTransfer.id,
      origin: dto.originHeadquartersId,
      date: savedTransfer.requestDate,
    });

    return savedTransfer;
  }

  async approveTransfer(transferId: number, userId: number): Promise<Transfer> {
    const transfer = await this.transferRepo.findById(transferId);
    if (!transfer) throw new NotFoundException('Transferencia no encontrada');

    // Validar stock físico antes de aprobar
    for (const item of transfer.items) {
      const stockDisponible = await this.inventoryService.getStockLevel(
        item.productId,
        transfer.originWarehouseId,
      );
      if (stockDisponible < item.quantity) {
        throw new BadRequestException(
          `Stock insuficiente para el producto ${item.productId}`,
        );
      }
    }

    transfer.approve();

    // Registrar Salida en Inventario (Activa el Trigger de Stock en la DB)
    await this.inventoryService.registerExit({
      refId: transfer.id,
      refTable: 'transferencia',
      observation: `Salida por transferencia #${transfer.id} (Aprobado por usuario ${userId})`,
      items: transfer.items.map((i) => ({
        productId: i.productId,
        warehouseId: transfer.originWarehouseId,
        quantity: i.quantity,
      })),
    });

    const savedTransfer = await this.transferRepo.save(transfer);
    this.transferGateway.notifyStatusChange(transfer.originHeadquartersId, {
      id: savedTransfer.id,
      status: TransferStatus.APPROVED,
    });

    return savedTransfer;
  }

  async confirmReceipt(transferId: number, userId: number): Promise<Transfer> {
    const transfer = await this.transferRepo.findById(transferId);
    if (!transfer) throw new NotFoundException('Transferencia no encontrada');

    transfer.complete();

    // Mover unidades físicamente en la tabla 'unidad'
    const allSeries = transfer.items.flatMap((i) => i.series);
    await Promise.all(
      allSeries.map((serie) =>
        this.unitRepo.updateLocationAndStatusBySerial(
          serie,
          transfer.destinationWarehouseId,
          UnitStatus.AVAILABLE,
        ),
      ),
    );

    // Registrar Ingreso en Inventario (Activa el Trigger de Stock en la DB)
    await this.inventoryService.registerIncome({
      refId: transfer.id,
      refTable: 'transferencia',
      observation: `Ingreso por transferencia #${transfer.id} (Confirmado por usuario ${userId})`,
      items: transfer.items.map((i) => ({
        productId: i.productId,
        warehouseId: transfer.destinationWarehouseId,
        quantity: i.quantity,
      })),
    });

    return await this.transferRepo.save(transfer);
  }

  async rejectTransfer(
    transferId: number,
    userId: number,
    reason: string,
  ): Promise<Transfer> {
    const transfer = await this.transferRepo.findById(transferId);
    if (!transfer) throw new NotFoundException('Transferencia no encontrada');

    transfer.reject(reason);

    // Liberar unidades (Volver a AVAILABLE)
    const allSeries = transfer.items.flatMap((i) => i.series);
    await Promise.all(
      allSeries.map((serie) =>
        this.unitRepo.updateStatusBySerial(serie, UnitStatus.AVAILABLE),
      ),
    );

    const savedTransfer = await this.transferRepo.save(transfer);
    this.transferGateway.notifyStatusChange(transfer.originHeadquartersId, {
      id: savedTransfer.id,
      status: TransferStatus.REJECTED,
      reason,
    });
    return savedTransfer;
  }

  // --- Métodos de Consulta ---

  getTransfersByHeadquarters(headquartersId: string): Promise<Transfer[]> {
    return this.transferRepo.findByHeadquarters(headquartersId);
  }

  async getTransferById(id: number): Promise<any> {
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

  async getAllTransfers(): Promise<any[]> {
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
  ): Promise<void> {
    const relation = await this.stockRepo.findOne({
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

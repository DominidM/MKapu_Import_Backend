/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  InventoryDetail,
  InventoryMovement,
} from '../../domain/entity/inventory-movement.entity';
import { InventoryMovementDetailOrmEntity } from '../../infrastructure/entity/inventory-movement-detail-orm.entity';
import { InventoryMovementOrmEntity } from '../../infrastructure/entity/inventory-movement-orm.entity';

export class InventoryMovementMapper {
  static toDomain(ormEntity: InventoryMovementOrmEntity): InventoryMovement {
    const items =
      ormEntity.details?.map(
        (d) =>
          new InventoryDetail(
            d.productId,
            d.warehouseId,
            d.quantity,
            d.type as any,
          ),
      ) || [];

    return new InventoryMovement({
      id: ormEntity.id,
      originType: ormEntity.originType as any,
      refId: ormEntity.refId,
      refTable: ormEntity.refTable,
      observation: ormEntity.observation,
      date: ormEntity.date,
      items: items,
    });
  }

  static toOrm(domainEntity: InventoryMovement): InventoryMovementOrmEntity {
    const orm = new InventoryMovementOrmEntity();

    if (domainEntity.id) orm.id = domainEntity.id;

    orm.originType = domainEntity.originType;
    orm.refId = domainEntity.refId;
    orm.refTable = domainEntity.refTable;
    orm.observation = domainEntity.observation;
    orm.date = domainEntity.date || new Date();

    orm.details = domainEntity.items.map((item) => {
      const detailOrm = new InventoryMovementDetailOrmEntity();
      detailOrm.productId = item.productId;
      detailOrm.warehouseId = item.warehouseId;
      detailOrm.quantity = item.quantity;
      detailOrm.type = item.type;
      return detailOrm;
    });

    return orm;
  }
}

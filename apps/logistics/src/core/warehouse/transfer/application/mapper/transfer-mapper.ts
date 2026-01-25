import {
  Transfer,
  TransferItem,
  TransferStatus,
} from '../../domain/entity/transfer-domain-entity';
import { TransferOrmEntity } from '../../infrastructure/entity/transfer-orm.entity';

export class TransferMapper {
  static mapToDomain(entity: TransferOrmEntity): Transfer {
    const itemsMap = new Map<number, string[]>();

    if (entity.details) {
      entity.details.forEach((d) => {
        const existing = itemsMap.get(d.productId) || [];
        existing.push(d.serialNumber);
        itemsMap.set(d.productId, existing);
      });
    }

    const items: TransferItem[] = [];
    itemsMap.forEach((series, productId) => {
      items.push(new TransferItem(productId, series));
    });
    return new Transfer(
      '0',
      entity.originWarehouseId,
      '0',
      entity.destinationWarehouseId,
      items,
      entity.motive,
      entity.id,
      entity.status as TransferStatus,
      entity.date,
    );
  }
}

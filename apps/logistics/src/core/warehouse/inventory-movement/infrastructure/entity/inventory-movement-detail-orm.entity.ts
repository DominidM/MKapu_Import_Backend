import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { InventoryMovementOrmEntity } from './inventory-movement-orm.entity';
import { StoreOrmEntity } from '../../../store/infrastructure/entity/store-orm.entity';
import { ProductOrmEntity } from 'apps/logistics/src/core/catalog/product/infrastructure/entity/product-orm.entity';

@Entity({ name: 'detalle_movimiento_inventario', schema: 'mkp_logistica' })
export class InventoryMovementDetailOrmEntity {
  @PrimaryGeneratedColumn({ name: 'id_detalle_inv', type: 'int' })
  id: number;

  @Column({ name: 'id_movimiento', type: 'int' })
  movementId: number;

  @Column({ name: 'id_producto', type: 'int' })
  productId: number;

  @Column({ name: 'id_almacen', type: 'int' })
  warehouseId: number;

  @Column({ name: 'cantidad', type: 'int' })
  quantity: number;

  @Column({
    name: 'tipo',
    type: 'enum',
    enum: ['INGRESO', 'SALIDA'],
  })
  type: string;

  // Relaciones
  @ManyToOne(() => InventoryMovementOrmEntity, (m) => m.details)
  @JoinColumn({ name: 'id_movimiento' })
  movement: InventoryMovementOrmEntity;

  @ManyToOne(() => ProductOrmEntity)
  @JoinColumn({ name: 'id_producto' })
  product: ProductOrmEntity;

  @ManyToOne(() => StoreOrmEntity)
  @JoinColumn({ name: 'id_almacen' })
  warehouse: StoreOrmEntity;
}

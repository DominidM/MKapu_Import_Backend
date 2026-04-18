/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Brackets } from 'typeorm';

import {
  IProductRepositoryPort,
  ProductAutocompleteVentasRaw,
  ProductStockVentasRaw,
  CategoriaConStockRaw,
} from '../../../../domain/ports/out/product-ports-out';

import { Product } from '../../../../domain/entity/product-domain-entity';
import { ProductOrmEntity } from '../../../entity/product-orm.entity';
import { ProductMapper } from '../../../../application/mapper/product.mapper';
import {
  ListProductFilterDto,
  ListProductStockFilterDto,
  ProductAutocompleteQueryDto,
} from '../../../../application/dto/in';
import { StockOrmEntity } from 'apps/logistics/src/core/warehouse/inventory/infrastructure/entity/stock-orm-entity';

@Injectable()
export class ProductTypeOrmRepository implements IProductRepositoryPort {
  constructor(
    @InjectRepository(ProductOrmEntity)
    private readonly repository: Repository<ProductOrmEntity>,

    @InjectRepository(StockOrmEntity)
    private readonly stockRepository: Repository<StockOrmEntity>,
  ) {}

  async save(product: Product): Promise<Product> {
    const ormEntity = ProductMapper.toOrmEntity(product);
    const saved = await this.repository.save(ormEntity);
    return ProductMapper.toDomainEntity(saved);
  }

  async update(product: Product): Promise<Product> {
    const ormEntity = ProductMapper.toOrmEntity(product);
    const saved = await this.repository.save(ormEntity);
    return ProductMapper.toDomainEntity(saved);
  }

  async delete(id: number): Promise<void> {
    await this.repository.update(id, { estado: false });
  }

  async findById(id: number): Promise<Product | null> {
    const found = await this.repository.findOne({
      where: { id_producto: id },
      relations: ['categoria'],
    });
    if (!found) return null;
    return ProductMapper.toDomainEntity(found);
  }

  async findAll(filters?: ListProductFilterDto): Promise<[Product[], number]> {
    const qb = this.repository
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.categoria', 'c');

    if (filters?.estado !== undefined) {
      qb.andWhere('p.estado = :estado', { estado: filters.estado });
    }

    if (filters?.id_categoria) {
      qb.andWhere('p.id_categoria = :id_categoria', {
        id_categoria: filters.id_categoria,
      });
    }

    if (filters?.search) {
      qb.andWhere(
        '(p.codigo LIKE :search OR p.descripcion LIKE :search OR p.anexo LIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    const limit = filters?.limit || 5;
    const page = filters?.page || 1;
    const skip = (page - 1) * limit;

    qb.skip(skip).take(limit);
    qb.orderBy('p.fec_creacion', 'DESC');

    const [results, total] = await qb.getManyAndCount();

    return [results.map(ProductMapper.toDomainEntity), total];
  }

  async findByCode(codigo: string): Promise<Product | null> {
    const found = await this.repository.findOne({
      where: { codigo },
      relations: ['categoria'],
    });
    if (!found) return null;
    return ProductMapper.toDomainEntity(found);
  }

  async findByCategory(id_categoria: number): Promise<Product[]> {
    const results = await this.repository.find({
      where: { categoria: { id_categoria } },
      relations: ['categoria'],
    });
    return results.map(ProductMapper.toDomainEntity);
  }

  async existsByCode(codigo: string): Promise<boolean> {
    const count = await this.repository.count({ where: { codigo } });
    return count > 0;
  }

  async findProductsStock(
    filters: ListProductStockFilterDto,
    page: number,
    size: number,
  ): Promise<[StockOrmEntity[], number]> {
    const { id_sede, codigo, nombre, id_categoria, categoria, activo } =
      filters;

    const queryBuilder = this.stockRepository
      .createQueryBuilder('stock')
      .leftJoinAndSelect('stock.producto', 'producto')
      .leftJoinAndSelect('producto.categoria', 'categoria')
      .where('stock.id_sede = :id_sede', { id_sede: String(id_sede) });

    if (codigo) queryBuilder.andWhere('producto.codigo = :codigo', { codigo });
    if (nombre)
      queryBuilder.andWhere('producto.anexo LIKE :nombre', {
        nombre: `%${nombre}%`,
      });
    if (id_categoria)
      queryBuilder.andWhere('producto.id_categoria = :id_categoria', {
        id_categoria,
      });
    if (categoria)
      queryBuilder.andWhere('categoria.nombre LIKE :categoria', {
        categoria: `%${categoria}%`,
      });
    if (activo !== undefined)
      queryBuilder.andWhere('producto.estado = :activo', { activo });

    queryBuilder.addSelect(
      `(SELECT MAX(w.id_merma) 
        FROM detalle_merma w 
        INNER JOIN merma m ON m.id_merma = w.id_merma 
        WHERE w.id_producto = producto.id_producto AND m.id_sede_ref = :id_sede)`,
      'id_merma',
    );
    queryBuilder.addSelect(
      `(SELECT MAX(a.id_remate) 
        FROM detalle_remate a 
        INNER JOIN remate r ON r.id_remate = a.id_remate 
        WHERE a.id_producto = producto.id_producto AND r.id_sede_ref = :id_sede)`,
      'id_remate',
    );

    queryBuilder.skip((page - 1) * size).take(size);
    queryBuilder.orderBy('producto.id_producto', 'ASC');

    const { entities, raw } = await queryBuilder.getRawAndEntities();
    const count = await queryBuilder.getCount();

    entities.forEach((entity) => {
      if (entity.producto) {
        const rawRow = raw.find(
          (r) =>
            r.producto_id_producto === entity.producto.id_producto ||
            r.id_producto === entity.producto.id_producto,
        );

        if (rawRow) {
          (entity.producto as any).id_merma = rawRow.id_merma
            ? Number(rawRow.id_merma)
            : null;
          (entity.producto as any).id_remate = rawRow.id_remate
            ? Number(rawRow.id_remate)
            : null;
        }
      }
    });

    return [entities, count];
  }

  async getProductDetailWithStock(
    id_producto: number,
    id_sede: number,
  ): Promise<{
    product: ProductOrmEntity | null;
    stock: StockOrmEntity | null;
  }> {
    const product = await this.repository.findOne({
      where: { id_producto },
      relations: ['categoria'],
    });

    if (!product) return { product: null, stock: null };

    const mermasRaw = await this.repository.manager.query(
      `SELECT MAX(w.id_merma) as id_merma 
       FROM detalle_merma w 
       INNER JOIN merma m ON m.id_merma = w.id_merma 
       WHERE w.id_producto = ? AND m.id_sede_ref = ?`,
      [id_producto, id_sede],
    );
    const rematesRaw = await this.repository.manager.query(
      `SELECT MAX(a.id_remate) as id_remate 
       FROM detalle_remate a 
       INNER JOIN remate r ON r.id_remate = a.id_remate 
       WHERE a.id_producto = ? AND r.id_sede_ref = ?`,
      [id_producto, id_sede],
    );

    (product as any).id_merma = mermasRaw[0]?.id_merma
      ? Number(mermasRaw[0].id_merma)
      : null;
    (product as any).id_remate = rematesRaw[0]?.id_remate
      ? Number(rematesRaw[0].id_remate)
      : null;

    const stock = await this.stockRepository.findOne({
      where: { id_sede: String(id_sede), id_producto: id_producto },
      relations: ['almacen', 'producto'],
      order: { id_stock: 'ASC' },
    });

    return { product, stock: stock ?? null };
  }

  async autocompleteProducts(dto: ProductAutocompleteQueryDto): Promise<
    Array<{
      id_producto: number;
      codigo: string;
      nombre: string;
      stock: number;
    }>
  > {
    const search = dto.search.trim();

    const qb = this.stockRepository
      .createQueryBuilder('stock')
      .innerJoin('stock.producto', 'producto')
      .where('stock.id_sede = :id_sede', { id_sede: dto.id_sede })
      .andWhere('producto.estado = :estado', { estado: true });

    if (dto.id_categoria) {
      qb.andWhere('producto.id_categoria = :id_categoria', {
        id_categoria: dto.id_categoria,
      });
    }

    qb.andWhere(
      new Brackets((w) => {
        w.where('producto.codigo LIKE :search', {
          search: `%${search}%`,
        }).orWhere('producto.anexo LIKE :search', { search: `%${search}%` });
      }),
    );

    qb.select([
      'producto.id_producto AS id_producto',
      'producto.codigo AS codigo',
      'producto.anexo AS nombre',
      'COALESCE(SUM(stock.cantidad), 0) AS stock',
    ])
      .groupBy('producto.id_producto')
      .addGroupBy('producto.codigo')
      .addGroupBy('producto.anexo')
      .orderBy('producto.codigo', 'ASC')
      .limit(5);

    const rows = await qb.getRawMany();

    return rows.map((r) => ({
      id_producto: Number(r.id_producto),
      codigo: r.codigo,
      nombre: r.nombre,
      stock: Number(r.stock),
    }));
  }

  /**
   * Autocomplete para ventas: devuelve una fila por cada combinación
   * producto × almacén de la sede, de modo que el frontend puede mostrar
   * el stock total y el desglose por almacén.
   *
   * stock_total  → suma de todos los almacenes del producto en la sede
   * stock        → stock de ese almacén particular
   */
  async autocompleteProductsVentas(
    id_sede: number,
    search?: string,
    id_categoria?: number,
  ): Promise<ProductAutocompleteVentasRaw[]> {
    const qb = this.stockRepository
      .createQueryBuilder('stock')
      .innerJoin('stock.producto', 'producto')
      .innerJoin('producto.categoria', 'categoria')
      // JOIN con almacen para obtener nombre; LEFT porque stock podría no tener almacen asignado
      .leftJoin('stock.almacen', 'almacen')
      .where('stock.id_sede = :id_sede', { id_sede: String(id_sede) })
      .andWhere('producto.estado = true');

    if (id_categoria) {
      qb.andWhere('producto.id_categoria = :id_categoria', { id_categoria });
    }

    if (search && search.length >= 2) {
      qb.andWhere(
        new Brackets((w) => {
          w.where('producto.codigo LIKE :search', {
            search: `%${search}%`,
          }).orWhere('producto.anexo LIKE :search', { search: `%${search}%` });
        }),
      );
    }

    // Una fila por producto × almacén
    // stock_total se calcula con subquery para no romper el GROUP BY
    qb.select([
      'producto.id_producto                       AS id_producto',
      'producto.codigo                            AS codigo',
      'producto.anexo                             AS nombre',
      'categoria.id_categoria                     AS id_categoria',
      'categoria.nombre                           AS familia',
      'COALESCE(stock.cantidad, 0)                AS stock',
      `COALESCE(stock.id_almacen, 0)              AS id_almacen`,
      `COALESCE(almacen.nombre, 'Sin almacén')    AS nombre_almacen`,
      `(SELECT COALESCE(SUM(s2.cantidad), 0)
          FROM stock s2
         WHERE s2.id_producto = producto.id_producto
           AND s2.id_sede     = stock.id_sede)    AS stock_total`,
      'producto.pre_unit                          AS precio_unitario',
      'producto.pre_caja                          AS precio_caja',
      'producto.pre_may                           AS precio_mayor',
      `COALESCE((SELECT c.cantidad_unidades FROM caja c WHERE c.id_producto = producto.id_producto LIMIT 1), 0) AS cantidad_unidades`,
    ])
      .orderBy('COALESCE(stock.cantidad, 0)', 'DESC')
      .addOrderBy('producto.codigo', 'ASC')
      .limit(30); // hasta 10 productos × 3 almacenes

    const rows = await qb.getRawMany();

    return rows.map((r) => ({
      id_producto: Number(r.id_producto),
      codigo: r.codigo,
      nombre: r.nombre,
      id_categoria: Number(r.id_categoria),
      familia: r.familia,
      stock: Number(r.stock),
      stock_total: Number(r.stock_total),
      id_almacen: Number(r.id_almacen),
      nombre_almacen: r.nombre_almacen,
      precio_unitario: Number(r.precio_unitario),
      precio_caja: Number(r.precio_caja),
      precio_mayor: Number(r.precio_mayor),
      cantidad_unidades: Number(r.cantidad_unidades),
    }));
  }

  async getProductsStockVentas(
    id_sede: number,
    page: number,
    size: number,
    search?: string,
    id_categoria?: number,
  ): Promise<[ProductStockVentasRaw[], number]> {
    const qb = this.stockRepository
      .createQueryBuilder('stock')
      .innerJoin('stock.producto', 'producto')
      .innerJoin('producto.categoria', 'categoria')
      .where('stock.id_sede = :id_sede', { id_sede: String(id_sede) })
      .andWhere('producto.estado = true')
      .andWhere('stock.cantidad > 0');

    if (id_categoria) {
      qb.andWhere('producto.id_categoria = :id_categoria', { id_categoria });
    }

    if (search) {
      qb.andWhere(
        new Brackets((w) => {
          w.where('producto.codigo LIKE :search', {
            search: `%${search}%`,
          }).orWhere('producto.anexo LIKE :search', { search: `%${search}%` });
        }),
      );
    }

    const groupBy = [
      'producto.id_producto',
      'producto.codigo',
      'producto.anexo',
      'categoria.nombre',
      'categoria.id_categoria',
      'producto.pre_unit',
      'producto.pre_caja',
      'producto.pre_may',
    ];

    const countResult = await this.stockRepository
      .createQueryBuilder('stock')
      .innerJoin('stock.producto', 'producto')
      .innerJoin('producto.categoria', 'categoria')
      .where('stock.id_sede = :id_sede', { id_sede: String(id_sede) })
      .andWhere('producto.estado = true')
      .andWhere('stock.cantidad > 0')
      .andWhere(
        id_categoria ? 'producto.id_categoria = :id_categoria' : '1=1',
        id_categoria ? { id_categoria } : {},
      )
      .andWhere(
        search
          ? new Brackets((w) => {
              w.where('producto.codigo LIKE :search', {
                search: `%${search}%`,
              }).orWhere('producto.anexo LIKE :search', {
                search: `%${search}%`,
              });
            })
          : '1=1',
      )
      .select('COUNT(DISTINCT producto.id_producto) AS total')
      .getRawOne();

    const total = Number(countResult?.total ?? 0);

    qb.select([
      'producto.id_producto     AS id_producto',
      'producto.codigo          AS codigo',
      'producto.anexo           AS nombre',
      'categoria.nombre         AS familia',
      'categoria.id_categoria   AS id_categoria',
      'COALESCE(SUM(stock.cantidad), 0) AS stock',
      'producto.pre_unit        AS precio_unitario',
      'producto.pre_caja        AS precio_caja',
      'producto.pre_may         AS precio_mayor',
    ]);

    groupBy.forEach((g, i) => (i === 0 ? qb.groupBy(g) : qb.addGroupBy(g)));

    qb.orderBy('producto.codigo', 'ASC')
      .offset((page - 1) * size)
      .limit(size);

    const rows = await qb.getRawMany();

    const data = rows.map((r) => ({
      id_producto: Number(r.id_producto),
      codigo: r.codigo,
      nombre: r.nombre,
      familia: r.familia,
      id_categoria: Number(r.id_categoria),
      stock: Number(r.stock),
      precio_unitario: Number(r.precio_unitario),
      precio_caja: Number(r.precio_caja),
      precio_mayor: Number(r.precio_mayor),
    }));

    return [data, total];
  }

  async getCategoriaConStock(id_sede: number): Promise<CategoriaConStockRaw[]> {
    const rows = await this.stockRepository
      .createQueryBuilder('stock')
      .innerJoin('stock.producto', 'producto')
      .innerJoin('producto.categoria', 'categoria')
      .where('stock.id_sede = :id_sede', { id_sede: String(id_sede) })
      .andWhere('producto.estado = true')
      .andWhere('stock.cantidad > 0')
      .select([
        'categoria.id_categoria  AS id_categoria',
        'categoria.nombre        AS nombre',
        'COUNT(DISTINCT producto.id_producto) AS total_productos',
      ])
      .groupBy('categoria.id_categoria')
      .addGroupBy('categoria.nombre')
      .orderBy('categoria.nombre', 'ASC')
      .getRawMany();

    return rows.map((r) => ({
      id_categoria: Number(r.id_categoria),
      nombre: r.nombre,
      total_productos: Number(r.total_productos),
    }));
  }

  async searchAutocompleteByCode(codigo: string): Promise<any[]> {
    const result = await this.repository
      .createQueryBuilder('p')
      .select([
        'p.id_producto AS id_producto',
        'p.codigo AS codigo',
        'p.descripcion AS descripcion',
        'p.pre_venta AS pre_venta',
        'COALESCE(SUM(s.cantidad), 0) AS stock',
      ])
      .leftJoin(StockOrmEntity, 's', 's.id_producto = p.id_producto')
      .where('p.codigo LIKE :codigo', { codigo: `%${codigo}%` })
      .andWhere('p.estado = :estado', { estado: true })
      .groupBy('p.id_producto')
      .limit(10)
      .getRawMany();

    return result;
  }

  async getProductsWeightsByIds(
    ids: string[],
  ): Promise<{ id: string; peso: number }[]> {
    if (!ids || ids.length === 0) return [];
    const { In } = await import('typeorm');
    const products = await this.repository.find({
      where: { id_producto: In(ids) },
      select: ['id_producto', 'peso_unitario'],
    });
    return products.map((p) => ({
      id: String(p.id_producto),
      peso: Number(p.peso_unitario) || 0,
    }));
  }

  async getProductsCodigoByIds(
    ids: number[],
  ): Promise<{ id_producto: number; codigo: string }[]> {
    if (!ids || ids.length === 0) return [];
    const { In } = await import('typeorm');
    const products = await this.repository.find({
      where: { id_producto: In(ids) },
      select: ['id_producto', 'codigo'],
    });
    return products.map((p) => ({
      id_producto: p.id_producto,
      codigo: p.codigo,
    }));
  }
}

/* ============================================
   administration/src/core/cashbox/infrastructure/adapters/out/cashbox-typeorm.repository.ts
   ============================================ */
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ICashboxRepositoryPort } from '../../../../domain/ports/out/cashbox-ports-out';
import { CashboxOrmEntity } from '../../../entity/cashbox-orm.entity';
import { Cashbox } from '../../../../domain/entity/cashbox-domain-entity';
@Injectable()
export class CashboxTypeOrmRepository implements ICashboxRepositoryPort {
  constructor(
    @InjectRepository(CashboxOrmEntity)
    private readonly repository: Repository<CashboxOrmEntity>,
  ) {}

  private mapToDomain(orm: CashboxOrmEntity): Cashbox {
    return new Cashbox(
      orm.id_caja,
      orm.id_sede_ref,
      orm.estado as any,
      orm.fec_apertura,
      orm.fec_cierre,
      orm.monto_inicial ?? null, 
    );
  }

  async save(cashbox: Cashbox): Promise<Cashbox> {
    const ormEntity = this.repository.create({
      id_caja:       cashbox.id_caja,
      id_sede_ref:   cashbox.id_sede_ref,
      estado:        cashbox.estado,
      fec_apertura:  cashbox.fec_apertura,
      fec_cierre:    cashbox.fec_cierre,
      monto_inicial: cashbox.monto_inicial ?? null, 
    });
    const saved = await this.repository.save(ormEntity);
    return this.mapToDomain(saved);
  }

  async update(cashbox: Cashbox): Promise<Cashbox> {
    await this.repository.update(cashbox.id_caja, {
      estado: cashbox.estado,
      fec_cierre: cashbox.fec_cierre, // Usando el nombre de propiedad del ORM
    });
    return cashbox;
  }

  async findById(id_caja: string): Promise<Cashbox | null> {
    const orm = await this.repository.findOne({ where: { id_caja } });
    return orm ? this.mapToDomain(orm) : null;
  }

  async findActiveBySede(id_sede_ref: number): Promise<Cashbox | null> {
    const orm = await this.repository.findOne({
      where: { id_sede_ref, estado: 'ABIERTA' as any },
    });
    return orm ? this.mapToDomain(orm) : null;
  }

  async existsActiveInSede(id_sede_ref: number): Promise<boolean> {
    const count = await this.repository.count({
      where: { id_sede_ref, estado: 'ABIERTA' as any },
    });
    return count > 0;
  }

async getResumenDia(idSede: number): Promise<any> {
  const [resumen, caja] = await Promise.all([
    this.repository.manager.query(`
      SELECT 
        COUNT(m.id_movimiento)                              AS totalVentas,
        COALESCE(SUM(m.monto), 0)                          AS totalMonto,
        COALESCE(AVG(m.monto), 0)                          AS ticketPromedio,
        COALESCE(SUM(CASE WHEN m.tipo_mov = 'INGRESO' THEN m.monto ELSE 0 END), 0) AS totalIngresos,
        COALESCE(SUM(CASE WHEN m.tipo_mov = 'EGRESO'  THEN m.monto ELSE 0 END), 0) AS totalEgresos
      FROM movimiento_caja m
      INNER JOIN caja c ON m.id_caja = c.id_caja
      WHERE c.id_sede_ref = ?
        AND c.estado = 'ABIERTA'
        AND DATE(m.fecha) = CURDATE()
    `, [idSede]),

    this.repository.manager.query(`
      SELECT 
        COALESCE(monto_inicial, 0) AS monto_inicial,
        id_caja
      FROM caja
      WHERE id_sede_ref = ? AND estado = 'ABIERTA'
      LIMIT 1
    `, [idSede]),
  ]);

  if (!resumen || resumen.length === 0) return null;

  const montoInicial  = Number(caja[0]?.monto_inicial ?? 0);
  const totalIngresos = Number(resumen[0].totalIngresos);
  const totalEgresos  = Number(resumen[0].totalEgresos);
  const dineroEnCaja  = montoInicial + totalIngresos - totalEgresos;

  return {
    totalVentas:    Number(resumen[0].totalVentas),
    totalMonto:     Number(resumen[0].totalMonto),
    ticketPromedio: Number(resumen[0].ticketPromedio),
    dineroEnCaja,                                      
  };
}

}
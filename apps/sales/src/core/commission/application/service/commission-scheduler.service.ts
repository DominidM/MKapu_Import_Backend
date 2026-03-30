import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { CommissionRuleOrmEntity } from '../../infrastructure/entity/commission-rule-orm.entity';

@Injectable()
export class CommissionSchedulerService implements OnApplicationBootstrap {
  private readonly logger = new Logger(CommissionSchedulerService.name);

  constructor(
    @InjectRepository(CommissionRuleOrmEntity)
    private readonly ruleRepo: Repository<CommissionRuleOrmEntity>,
  ) {}

  // ── Al arrancar el sistema ─────────────────────────────────────────────────
  async onApplicationBootstrap(): Promise<void> {
    this.logger.log(' Verificando reglas vencidas al iniciar...');
    await this.desactivarReglasVencidas();
  }

  // ── Todos los días a medianoche ────────────────────────────────────────────
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async desactivarReglasVencidas(): Promise<void> {
    const ahora = new Date();

    const result = await this.ruleRepo.update(
      {
        activo: true,
        fecha_fin: LessThan(ahora),
      },
      { activo: false },
    );

    if (result.affected > 0) {
      this.logger.log(
        ` ${result.affected} regla(s) vencidas desactivadas automáticamente`,
      );
    }
  }
}
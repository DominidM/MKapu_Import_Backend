import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { QuoteOrmEntity } from '../../infrastructure/entity/quote-orm.entity';

@Injectable()
export class QuoteSchedulerService implements OnApplicationBootstrap {
  private readonly logger = new Logger(QuoteSchedulerService.name);

  constructor(
    @InjectRepository(QuoteOrmEntity)
    private readonly quoteRepo: Repository<QuoteOrmEntity>,
  ) {}

  // ── Al arrancar el sistema ─────────────────────────────────────────────────
  async onApplicationBootstrap(): Promise<void> {
    this.logger.log('Verificando cotizaciones vencidas al iniciar...');
    await this.vencerCotizacionesExpiradas();
  }

  // ── Todos los días a medianoche ────────────────────────────────────────────
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async vencerCotizacionesExpiradas(): Promise<void> {
    const ahora = new Date();

    const result = await this.quoteRepo.update(
      {
        estado:    'PENDIENTE',
        fec_venc:  LessThan(ahora),
        activo:    true,
      },
      { estado: 'VENCIDA' },
    );

    if (result.affected > 0) {
      this.logger.log(
        `${result.affected} cotización(es) marcadas como VENCIDA automáticamente`,
      );
    }
  }
}
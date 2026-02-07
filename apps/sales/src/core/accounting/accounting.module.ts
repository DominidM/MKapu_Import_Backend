import { Module } from '@nestjs/common';
import { SalesBookService } from './application/service/sales-book.service';
import { SalesBookTypeOrmRepository } from './infrastructure/adapters/out/repository/sales-book-typeorm.repository';
import { SalesBookController } from './infrastructure/adapters/in/controllers/sales-book.controller';
import { ISalesBookUseCase } from './domain/ports/in/sales-book-use-case';
import { ISalesBookRepositoryPort } from './domain/ports/out/sales-book-repository.port';

@Module({
  imports: [],
  controllers: [SalesBookController],
  providers: [
    {
      provide: ISalesBookUseCase,
      useClass: SalesBookService,
    },
    {
      provide: ISalesBookRepositoryPort,
      useClass: SalesBookTypeOrmRepository,
    },
  ],
})
export class AccountingModule {}

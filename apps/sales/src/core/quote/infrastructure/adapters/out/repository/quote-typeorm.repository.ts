import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IQuoteRepositoryPort } from '../../../../domain/ports/out/quote-ports-out';
import { QuoteOrmEntity } from '../../../entity/quote-orm.entity';
import { QuoteDetailOrmEntity } from '../../../entity/quote-orm-detail.entity';
import { Quote } from '../../../../domain/entity/quote-domain-entity';
import { QuoteMapper } from '../../../../application/mapper/quote.mapper';
import { ICustomerRepositoryPort } from '../../../../../customer/domain/ports/out/customer-port-out'; 

@Injectable()
export class QuoteTypeOrmRepository implements IQuoteRepositoryPort {
  constructor(
    @InjectRepository(QuoteOrmEntity)
    private readonly repository: Repository<QuoteOrmEntity>,
    @InjectRepository(QuoteDetailOrmEntity)
    private readonly detailRepository: Repository<QuoteDetailOrmEntity>,
    @Inject('ICustomerRepositoryPort')
    private readonly customerRepository: ICustomerRepositoryPort // <-- debes inyectar aquí
  ) {}

  async save(quote: Quote): Promise<Quote> {
    const ormEntity = QuoteMapper.toOrmEntity(quote);
    const saved = await this.repository.save(ormEntity);
    return QuoteMapper.toDomain(saved);
  }

  async update(quote: Quote): Promise<Quote> {
    await this.repository.update(quote.id_cotizacion!, {
      estado: quote.estado,
      activo: quote.activo,
      total: quote.total,
    });
    return this.findById(quote.id_cotizacion!); 
  }

  async findById(id: number): Promise<Quote | null> {
    const orm = await this.repository.findOne({ 
        where: { id_cotizacion: id },
        relations: ['customer', 'detalles'] 
    });
    return orm ? QuoteMapper.toDomain(orm) : null;
  }

  // IMPLEMENTACIÓN ESTRICTA DEL PORT: busca por id_cliente (uuid)
  async findByCustomerId(id_cliente: string): Promise<Quote[]> {
    const orms = await this.repository.find({
      where: { id_cliente },
      order: { fec_emision: 'DESC' },
      relations: ['detalles']
    });
    return orms.map(orm => QuoteMapper.toDomain(orm));
  }

  // MÉTODO DE AYUDA opcional (NO en el port, pero puedes usarlo internamente)
  async findByCustomerDocument(valor_doc: string): Promise<Quote[]> {
    // 1. Busca el cliente por su valor_doc (dni/ruc)
    const customer = await this.customerRepository.findByDocument(valor_doc);
    if (!customer) return [];
    // 2. Usa el método oficial del port
    return this.findByCustomerId(customer.id_cliente);
  }
}
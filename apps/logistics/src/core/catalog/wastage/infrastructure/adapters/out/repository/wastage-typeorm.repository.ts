import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IWastageRepositoryPort } from '../../../../domain/ports/out/wastage.port.out';
import { Wastage } from '../../../../domain/entity/wastage-domain-intity';
import { WastageOrmEntity } from '../../../entity/wastage-orm.entity';

@Injectable()
export class WastageTypeOrmRepository implements IWastageRepositoryPort {
  constructor(
    @InjectRepository(WastageOrmEntity)
    private readonly typeOrmRepository: Repository<WastageOrmEntity>,
  ) {}

  async save(domain: Wastage): Promise<Wastage> {
    // Aquí usamos la lógica de persistencia (puedes usar un mapper aquí también)
    const ormEntity = this.toOrmEntity(domain);
    const savedOrm = await this.typeOrmRepository.save(ormEntity);
    return this.toDomainEntity(savedOrm);
  }

  async findById(id: number): Promise<Wastage | null> {
    const orm = await this.typeOrmRepository.findOne({
      where: { id_merma: id },
      relations: ['detalles'], // Cargamos los productos de la merma
    });
    return orm ? this.toDomainEntity(orm) : null;
  }

  async findAll(): Promise<Wastage[]> {
    const orms = await this.typeOrmRepository.find({ relations: ['detalles'] });
    return orms.map((orm) => this.toDomainEntity(orm));
  }

  // Mappers internos (Infraestructura <-> Dominio)
  private toOrmEntity(domain: Wastage): WastageOrmEntity {
    const orm = new WastageOrmEntity();
    Object.assign(orm, domain); // Gracias al cascade: true en la entidad ORM, guarda los detalles
    return orm;
  }

  private toDomainEntity(orm: any): Wastage {
      // Re-mapeo a la clase de dominio para mantener la pureza
    return new Wastage(
        orm.id_merma,        
        orm.id_usuario_ref,  
        orm.id_sede_ref,     
        orm.id_almacen_ref,  
        orm.motivo,          
        orm.fec_merma,       
        orm.estado,          
        orm.detalles         
    );
  }
}
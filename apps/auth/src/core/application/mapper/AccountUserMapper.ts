/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { AccountUser } from '../../domain/entity/account-user';
import { AccountUserOrmEntity } from '../../infrastructure/entity/account-user-orm-entity';
import { AccountUserResponseDto } from '../dto/out/AccountUserResponseDto';

export class AccountUserMapper {
  static toDomain(ormEntity: AccountUserOrmEntity): AccountUser {
    const email = ormEntity.usuario?.email || ormEntity.email_emp || '';

    return AccountUser.create({
      id: ormEntity.id_cuenta,
      nombreUsuario: ormEntity.nom_usu,
      contrasenia: ormEntity.contraseña,
      email: email,
      rolNombre: ormEntity.roles?.[0]?.nombre || 'SIN_ROL',
      estado: ormEntity.activo, 
    });
  }

  static toAccountUserResponseDto(
    entity: AccountUserOrmEntity,
  ): AccountUserResponseDto {
    return {
      id: entity.id_cuenta,
      nombreUsuario: entity.nom_usu,
      email: entity.usuario?.email || entity.email_emp || '',
      estado: entity.activo,
      rolNombre: entity.roles?.[0]?.nombre || '',
      isActive(): boolean {
        return entity.activo;
      },
    };
  }

  static toDomainEntity(ormEntity: AccountUserOrmEntity): AccountUser {
    return AccountUser.create({
      id: ormEntity.id_cuenta,
      nombreUsuario: ormEntity.nom_usu,
      contrasenia: ormEntity.contraseña,
      email: ormEntity.usuario?.email || ormEntity.email_emp || '',
      estado: ormEntity.activo,
      rolNombre: ormEntity.roles && ormEntity.roles.length > 0 ? ormEntity.roles[0].nombre : '',
    });
  }

  static toOrmEntity(domainEntity: AccountUser): AccountUserOrmEntity {
    const ormEntity = new AccountUserOrmEntity();
    ormEntity.id_cuenta = domainEntity.id;
    ormEntity.nom_usu = domainEntity.nombreUsuario;
    ormEntity.contraseña = domainEntity.contrasenia;
    ormEntity.activo = domainEntity.estado; 
    
    return ormEntity;
  }
  static toDto(domain: AccountUser): AccountUserResponseDto {
    return {
      id: domain.id,
      nombreUsuario: domain.nombreUsuario,
      email: domain.email,
      estado: domain.estado,
      rolNombre: domain.rolNombre,
      isActive(): boolean {
        return domain.estado;
      },
    };
  }
}
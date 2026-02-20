/* ============================================
   sales/src/core/customer/application/mapper/customer.mapper.ts
   ============================================ */

import { Customer } from '../../domain/entity/customer-domain-entity';
import { DocumentType } from '../../domain/entity/document-type-domain-entity';
import { RegisterCustomerDto, UpdateCustomerDto } from '../dto/in';
import { 
  CustomerResponseDto, 
  CustomerListResponse, 
  CustomerDeletedResponseDto,
  DocumentTypeResponseDto 
} from '../dto/out';
import { CustomerOrmEntity } from '../../infrastructure/entity/customer-orm.entity';
import { DocumentTypeOrmEntity } from '../../infrastructure/entity/document-type-orm.entity';
import { v4 as uuidv4 } from 'uuid';

export class CustomerMapper {
  // Domain Entity → Response DTO (Incluye nuevos campos)
  static toResponseDto(customer: Customer): CustomerResponseDto {
    return {
      customerId: customer.id_cliente!,
      documentTypeId: customer.id_tipo_documento,
      documentTypeDescription: customer.tipoDocumentoDescripcion || '',
      documentTypeSunatCode: customer.tipoDocumentoCodSunat || '',
      documentValue: customer.valor_doc,
      name: customer.nombres,
      apellido: customer.apellidos,     
      razonsocial: customer.razon_social, 
      address: customer.direccion,
      email: customer.email,
      phone: customer.telefono,
      status: customer.estado,
      displayName: customer.getDisplayName(),
      invoiceType: customer.getInvoiceType(),
    };
  }

  static toListResponse(customers: Customer[], total: number): CustomerListResponse {
    return {
      customers: customers.map((c) => this.toResponseDto(c)),
      total: total, // Total real de registros filtrados
    };
  }

  private static pickString(...vals: Array<string | undefined | null>): string | null {
    for (const v of vals) {
      if (v !== undefined && v !== null) {
        const s = String(v).trim();
        if (s.length > 0) return s;
      }
    }
    return null;
  }

  // Register DTO → Domain Entity
  static fromRegisterDto(dto: RegisterCustomerDto, tipoDocumentoCodSunat?: string): Customer {
    const businessName = this.pickString((dto as any).businessName, (dto as any).razon_social, (dto as any).razonSocial);
    const name = this.pickString((dto as any).name, (dto as any).nombres);
    const lastName = this.pickString((dto as any).lastName, (dto as any).apellido, (dto as any).apellidos);

    let nombres: string | null = name;
    let apellidos: string | null = lastName;
    let razon_social: string | null = businessName;

    if (tipoDocumentoCodSunat === '06') {
      razon_social = businessName;
      nombres = null;
      apellidos = null;
    } else if (tipoDocumentoCodSunat === '01') {
      nombres = name;
      apellidos = lastName;
      razon_social = null;
    } else {
      razon_social = businessName;
      nombres = name;
      apellidos = lastName;
    }

    return Customer.create({
      id_cliente: uuidv4(),
      id_tipo_documento: dto.documentTypeId,
      valor_doc: dto.documentValue,
      nombres: nombres,
      apellidos: apellidos,       
      razon_social: razon_social, 
      direccion: dto.address ?? null,
      email: dto.email ?? null,
      telefono: dto.phone ?? null,
      estado: true,
      tipoDocumentoCodSunat: tipoDocumentoCodSunat,
    });
  }

  // Update DTO → Domain Entity
  static fromUpdateDto(customer: Customer, dto: UpdateCustomerDto, tipoDocumentoCodSunat?: string): Customer {
    const tipoSunat = tipoDocumentoCodSunat ?? customer.tipoDocumentoCodSunat;

    const incomingBusinessName = this.pickString((dto as any).businessName, (dto as any).razon_social, (dto as any).razonSocial);
    const incomingName = this.pickString((dto as any).name, (dto as any).nombres);
    const incomingLastName = this.pickString((dto as any).lastName, (dto as any).apellido, (dto as any).apellidos);

    const baseDocumentTypeId = dto.documentTypeId ?? customer.id_tipo_documento;
    const baseValorDoc = dto.documentValue ?? customer.valor_doc;
    const baseAddress = dto.address ?? customer.direccion;
    const baseEmail = dto.email ?? customer.email;
    const basePhone = dto.phone ?? customer.telefono;

    let finalRazonSocial = customer.razon_social ?? null;
    let finalNombres = customer.nombres ?? null;
    let finalApellidos = customer.apellidos ?? null;

    if (tipoSunat === '06') {
      finalRazonSocial = incomingBusinessName ?? (dto.businessName ?? dto.businessName ?? customer.razon_social ?? null);
      finalNombres = null;
      finalApellidos = null;
    } else if (tipoSunat === '01') {
      finalNombres = incomingName ?? (dto.name ?? customer.nombres ?? null);
      finalApellidos = incomingLastName ?? (dto.lastName ?? customer.apellidos ?? null);
      finalRazonSocial = null;
    } else {
      finalRazonSocial = incomingBusinessName ?? customer.razon_social ?? null;
      finalNombres = incomingName ?? customer.nombres ?? null;
      finalApellidos = incomingLastName ?? customer.apellidos ?? null;
    }

    return Customer.create({
      id_cliente:               customer.id_cliente,
      id_tipo_documento:        baseDocumentTypeId,
      valor_doc:                baseValorDoc,
      nombres:                  finalNombres,
      apellidos:                finalApellidos,
      razon_social:             finalRazonSocial,
      direccion:                baseAddress,
      email:                    baseEmail,
      telefono:                 basePhone,
      estado:                   customer.estado,
      tipoDocumentoDescripcion: customer.tipoDocumentoDescripcion,
      tipoDocumentoCodSunat:    tipoSunat ?? customer.tipoDocumentoCodSunat,
    });
  }
  
  static withStatus(customer: Customer, status: boolean): Customer {
    return Customer.create({
      ...customer['props'], 
      estado: status,
    });
  }

  static toDeletedResponse(customerId: string): CustomerDeletedResponseDto {
    return {
      customerId,
      message: 'Cliente eliminado correctamente',
      deletedAt: new Date(),
    };
  }

  // ORM Entity → Domain Entity
  static toDomainEntity(customerOrm: CustomerOrmEntity): Customer {
    let estado = true;
    if (typeof customerOrm.estado === 'boolean') {
      estado = customerOrm.estado;
    } else if (typeof customerOrm.estado === 'number') {
      estado = customerOrm.estado === 1;
    } else if (Buffer.isBuffer(customerOrm.estado)) {
      estado = (customerOrm.estado as any)[0] === 1;
    }

    return Customer.create({
      id_cliente: customerOrm.id_cliente,
      id_tipo_documento: customerOrm.id_tipo_documento,
      valor_doc: customerOrm.valor_doc,
      nombres: customerOrm.nombres,
      apellidos: customerOrm.apellidos,       
      razon_social: customerOrm.razon_social, 
      direccion: customerOrm.direccion,
      email: customerOrm.email,
      telefono: customerOrm.telefono,
      estado: estado,
      tipoDocumentoDescripcion: customerOrm.tipoDocumento?.descripcion,
      tipoDocumentoCodSunat: customerOrm.tipoDocumento?.cod_sunat,
    });
  }

  // Domain Entity → ORM Entity
  static toOrmEntity(customer: Customer): CustomerOrmEntity {
    const customerOrm = new CustomerOrmEntity();
    customerOrm.id_cliente = customer.id_cliente!;
    customerOrm.id_tipo_documento = customer.id_tipo_documento;
    customerOrm.valor_doc = customer.valor_doc;
    customerOrm.nombres = customer.nombres ?? null;
    customerOrm.apellidos = customer.apellidos ?? null;       
    customerOrm.razon_social = customer.razon_social ?? null;
    customerOrm.direccion = customer.direccion ?? null;
    customerOrm.email = customer.email ?? null;
    customerOrm.telefono = customer.telefono ?? null;
    customerOrm.estado = customer.estado;
    return customerOrm;
  }

  static documentTypeToDomain(docTypeOrm: DocumentTypeOrmEntity): DocumentType {
    return DocumentType.create({
      id_tipo_documento: docTypeOrm.id_tipo_documento,
      cod_sunat: docTypeOrm.cod_sunat,
      descripcion: docTypeOrm.descripcion,
    });
  }

  static documentTypeToResponseDto(docType: DocumentType): DocumentTypeResponseDto {
    return {
      documentTypeId: docType.id_tipo_documento,
      sunatCode: docType.cod_sunat,
      description: docType.descripcion,
    };
  }
}
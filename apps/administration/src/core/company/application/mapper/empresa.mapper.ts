import { Empresa } from '../../domain/entity/empresa.entity';
import { EmpresaResponseDto } from '../dto/out/empresa-response.dto';

export class EmpresaMapper {
  static toResponse(empresa: Empresa): EmpresaResponseDto {
    return {
      id:               empresa.id,
      nombreComercial:  empresa.nombreComercial,
      razonSocial:      empresa.razonSocial,
      ruc:              empresa.ruc,
      sitioWeb:         empresa.sitioWeb,
      direccion:        empresa.direccion,
      ciudad:           empresa.ciudad,
      departamento:     empresa.departamento,
      telefono:         empresa.telefono,
      email:            empresa.email,
      logoUrl:          empresa.logoUrl,
      updatedAt:        empresa.updatedAt,
    };
  }
}
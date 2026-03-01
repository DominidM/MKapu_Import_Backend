import { AssignWarehouseToSedeDto } from '../../../application/dto/in';
import {
  SedeAlmacenListResponseDto,
  SedeAlmacenResponseDto,
} from '../../../application/dto/out';

/*  administration/src/core/sede-almacen/domain/ports/in/sede-almacen-ports-in.ts */
export interface ISedeAlmacenCommandPort {
  assignWarehouseToSede(
    dto: AssignWarehouseToSedeDto,
  ): Promise<SedeAlmacenResponseDto>;
}

export interface ISedeAlmacenQueryPort {
  listWarehousesBySede(id_sede: number): Promise<SedeAlmacenListResponseDto>;
  getAssignmentByWarehouse(id_almacen: number): Promise<SedeAlmacenResponseDto>;
}

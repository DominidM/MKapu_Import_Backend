import {
  ActualizarDetalleConteoDto,
  FinalizarConteoDto,
  IniciarConteoDto,
} from '../../../application/dto/in/inventory-count-dto-in';
import { ListInventoryCountFilterDto } from '../../../application/dto/in/list-inventory-count-filter.dto';
import * as ExcelJS from 'exceljs';
export interface IInventoryCountCommandPort {
  initInventoryCount(dto: IniciarConteoDto);
  endInventoryCount(idConteo: number, dto: FinalizarConteoDto);
  registerPhysicCount(idDetalle: number, dto: ActualizarDetalleConteoDto);
}
export interface IInventoryCountQueryPort {
  obtenerConteoConDetalles(idConteo: number): Promise<any>;
  listarConteosPorSede(filtros: ListInventoryCountFilterDto): Promise<any>;
  exportarConteoExcel(idConteo: number): Promise<ExcelJS.Buffer>;
  exportarConteoPdf(idConteo: number): Promise<Buffer>;
}

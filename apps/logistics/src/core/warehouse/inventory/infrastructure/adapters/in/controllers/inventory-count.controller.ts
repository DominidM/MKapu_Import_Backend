import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { InventoryCommandService } from '../../../../application/service/inventory-command.service';
import {
  ActualizarDetalleConteoDto,
  FinalizarConteoDto,
  IniciarConteoDto,
} from '../../../../application/dto/in/inventory-count-dto-in';
import { InventoryQueryService } from '../../../../application/service/inventory-query.service';
import { ListInventoryCountFilterDto } from '../../../../application/dto/in/list-inventory-count-filter.dto';

@Controller('conteo-inventario')
export class InventoryCountController {
  constructor(
    private readonly inventoryService: InventoryCommandService,
    private readonly inventoryQueryService: InventoryQueryService,
  ) {}

  @Post()
  async iniciar(@Body() dto: IniciarConteoDto) {
    return await this.inventoryService.iniciarConteoInventario(dto);
  }
  @Get()
  async listarConteos(@Query() filter: ListInventoryCountFilterDto) {
    return await this.inventoryQueryService.listarConteosPorSede(filter);
  }
  @Patch('detalle/:idDetalle')
  async actualizarDetalle(
    @Param('idDetalle') idDetalle: number,
    @Body() dto: ActualizarDetalleConteoDto,
  ) {
    return await this.inventoryService.registrarConteoFisico(idDetalle, dto);
  }

  @Patch(':idConteo/finalizar')
  async finalizar(
    @Param('idConteo') idConteo: number,
    @Body() dto: FinalizarConteoDto,
  ) {
    return await this.inventoryService.finalizarConteoInventario(idConteo, dto);
  }

  @Get(':idConteo')
  async obtenerDetalle(@Param('idConteo') idConteo: number) {
    return await this.inventoryQueryService.obtenerConteoConDetalles(idConteo);
  }
}

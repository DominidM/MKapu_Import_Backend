import { Controller, Get, Query } from '@nestjs/common';
import { WarehouseReportsQueryService } from '../../../../application/service/warehouse-reports-query.service';
import { WarehouseReportsFilterDto } from '../../../../application/dto/in/warehouse-reports-filter.dto';
@Controller('warehouse/reports')
export class WarehouseReportsController {
  constructor(
    private readonly reportsQueryService: WarehouseReportsQueryService,
  ) {}

  @Get('kpis')
  async getKpis(@Query() filters: WarehouseReportsFilterDto) {
    return this.reportsQueryService.getKpis(filters);
  }

  @Get('rendimiento-chart')
  async getRendimientoChart(@Query() filters: WarehouseReportsFilterDto) {
    return this.reportsQueryService.getRendimientoChart(filters);
  }

  @Get('salud-stock')
  async getSaludStock(@Query() filters: WarehouseReportsFilterDto) {
    return this.reportsQueryService.getSaludStock(filters);
  }

  @Get('movimientos-recientes')
  async getMovimientosRecientes(@Query() filters: WarehouseReportsFilterDto) {
    return this.reportsQueryService.getMovimientosRecientes(filters);
  }

  @Get('productos-criticos')
  async getProductosCriticos(@Query() filters: WarehouseReportsFilterDto) {
    return this.reportsQueryService.getProductosCriticos(filters);
  }
}

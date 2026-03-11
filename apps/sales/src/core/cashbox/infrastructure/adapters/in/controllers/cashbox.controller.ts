/* ============================================
   administration/src/core/cashbox/infrastructure/adapters/in/cashbox.controller.ts
   ============================================ */
import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  ParseIntPipe,
  Inject,
  Patch,
  Res,
} from '@nestjs/common';
import {
  ICashboxCommandPort,
  ICashboxQueryPort,
} from '../../../../domain/ports/in/cashbox-ports-in';
import {
  OpenCashboxDto,
  CloseCashboxDto,
} from '../../../../application/dto/in';
import { Response } from 'express';

@Controller('cashbox')
export class CashboxController {
  constructor(
    @Inject('ICashboxCommandPort')
    private readonly commandPort: ICashboxCommandPort,
    @Inject('ICashboxQueryPort')
    private readonly queryPort: ICashboxQueryPort,
  ) {}

  @Post('open')
  async open(@Body() dto: OpenCashboxDto) {
    return await this.commandPort.openCashbox(dto);
  }

  @Patch('close')
  async close(@Body() dto: CloseCashboxDto) {
    return await this.commandPort.closeCashbox(dto);
  }

  @Get('active/:idSede')      
  async getActive(@Param('idSede', ParseIntPipe) idSede: number) {
    return await this.queryPort.findActiveBySede(idSede);
  }

  @Get('resumen/:idSede')     
  async getResumen(@Param('idSede', ParseIntPipe) idSede: number) {
    return await this.queryPort.getResumenDia(idSede);
  }

  @Get('resumen/:idSede/export/thermal')
  async exportThermalResumen(
    @Param('idSede', ParseIntPipe) idSede: number,
    @Res() res: Response,
  ) {
    const buffer = await this.queryPort.exportThermalResumen(idSede);
    (res as any).set({
      'Content-Type':        'application/pdf',
      'Content-Disposition': `inline; filename=Resumen-Caja-Sede-${idSede}.pdf`,
      'Content-Length':      buffer.length,
    });
    (res as any).end(buffer);
  }

  // Historial de cajas cerradas por sede
  @Get('historial/:idSede')
  async getHistorial(@Param('idSede', ParseIntPipe) idSede: number) {
    return await this.queryPort.getHistorialBySede(idSede);
  }

  // Reporte térmico de caja histórica por id_caja
  @Get(':idCaja/export/thermal')
  async exportThermalById(
    @Param('idCaja') idCaja: string,
    @Res() res: Response,
  ) {
    const buffer = await this.queryPort.exportThermalById(idCaja);
    (res as any).set({
      'Content-Type':        'application/pdf',
      'Content-Disposition': `inline; filename=Resumen-Caja-${idCaja}.pdf`,
      'Content-Length':      buffer.length,
    });
      (res as any).end(buffer);
  }

  @Get(':id')                  
  async getById(@Param('id') id: string) {
    return await this.queryPort.getById(id);
  }

  
}
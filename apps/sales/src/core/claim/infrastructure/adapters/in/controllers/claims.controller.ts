/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Res,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import {
  CLAIM_COMMAND_PORT,
  CLAIM_QUERY_PORT,
  IClaimCommandPort,
  IClaimQueryPort,
} from '../../../../domain/ports/in/claim-port-in';
import { RegisterClaimDto }  from '../../../../application/dto/in/register-claim-dto';
import { ClaimResponseDto }  from '../../../../application/dto/out/claim-response-dto';
import { ClaimMapper }       from '../../../../application/mapper/claim.mapper';

@ApiTags('Reclamos')
@Controller('claims')
export class ClaimRestController {

  constructor(
    @Inject(CLAIM_COMMAND_PORT)
    private readonly claimCommand: IClaimCommandPort,
    @Inject(CLAIM_QUERY_PORT)
    private readonly claimQuery: IClaimQueryPort,
  ) {}

  // ── Comandos ──────────────────────────────────────────────────────

  @Post()
  @ApiOperation({ summary: 'Registrar un nuevo reclamo' })
  async register(@Body() dto: RegisterClaimDto) {
    return await this.claimCommand.register(dto);
  }

  @Patch(':id/attend')
  @ApiOperation({ summary: 'Atender un reclamo (Administrativo)' })
  async attend(
    @Param('id', ParseIntPipe) id: number,
    @Body('respuesta') respuesta: string,
  ) {
    return await this.claimCommand.attend(id, respuesta);
  }

  @Patch(':id/resolve')
  async resolve(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: { respuesta: string },
  ): Promise<ClaimResponseDto> {
    return await this.claimCommand.resolve(id, updateDto.respuesta);
  }

  // ── Rutas estáticas — ANTES de :id ───────────────────────────────

  @Get('whatsapp/status')
  @ApiOperation({ summary: 'Estado de sesión WhatsApp' })
  async whatsAppStatus() {
    return this.claimQuery.whatsAppStatus();
  }

  // ── Consultas ─────────────────────────────────────────────────────

  @Get('receipt/:receiptId')
  @ApiOperation({ summary: 'Listar reclamos por comprobante' })
  async listByReceipt(@Param('receiptId', ParseIntPipe) receiptId: number) {
    return await this.claimQuery.listBySalesReceipt(receiptId);
  }

  @Get('sede/:sedeId')
  @ApiOperation({ summary: 'Listar reclamos por sede' })
  @ApiParam({ name: 'sedeId', description: 'ID de la sede del usuario', type: 'number' })
  async listBySede(@Param('sedeId', ParseIntPipe) sedeId: number) {
    return await this.claimQuery.listBySede(sedeId);
  }

  // ── Rutas dinámicas con :id ───────────────────────────────────────

  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalle de un reclamo' })
  async getById(@Param('id', ParseIntPipe) id: number) {
    const claim = await this.claimQuery.getById(id);
    return ClaimMapper.toResponseDto(claim);
  }

  @Get(':id/pdf')
  @ApiOperation({ summary: 'Exportar reclamo a PDF' })
  async exportPdf(@Param('id', ParseIntPipe) id: number, @Res() res: Response) {
    const buffer = await this.claimQuery.exportPdf(id);
    res.set({
      'Content-Type':        'application/pdf',
      'Content-Disposition': `attachment; filename=Reclamo_REC-${id}.pdf`,
      'Content-Length':      buffer.length,
    });
    res.end(buffer);
  }

  @Post(':id/send-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Enviar reclamo por email al cliente' })
  async sendByEmail(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ message: string; sentTo: string }> {
    return this.claimQuery.sendByEmail(id);
  }

  @Post(':id/send-whatsapp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Enviar reclamo por WhatsApp al cliente' })
  async sendByWhatsApp(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ message: string; sentTo: string }> {
    return this.claimQuery.sendByWhatsApp(id);
  }
}
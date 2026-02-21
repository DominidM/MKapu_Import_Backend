/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Controller,
  Post,
  Put,
  Delete,
  Get,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  Inject,
  ParseIntPipe,
  DefaultValuePipe,
  BadRequestException,
} from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import {
  ISalesReceiptCommandPort,
  ISalesReceiptQueryPort,
} from '../../../../domain/ports/in/sales_receipt-ports-in';
import {
  RegisterSalesReceiptDto,
  AnnulSalesReceiptDto,
  ListSalesReceiptFilterDto,
} from '../../../../application/dto/in';
import {
  SalesReceiptResponseDto,
  SalesReceiptListResponse,
  SalesReceiptDeletedResponseDto,
  SalesReceiptSummaryListResponse,
  SalesReceiptWithHistoryDto,
  CustomerPurchaseHistoryDto,
  SalesReceiptAutocompleteResponseDto, // ✅ NUEVO
} from '../../../../application/dto/out';

@Controller('receipts')
export class SalesReceiptRestController {
  constructor(
    @Inject('ISalesReceiptQueryPort')
    private readonly receiptQueryService: ISalesReceiptQueryPort,
    @Inject('ISalesReceiptCommandPort')
    private readonly receiptCommandService: ISalesReceiptCommandPort,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async registerReceipt(
    @Body() dto: RegisterSalesReceiptDto,
  ): Promise<SalesReceiptResponseDto> {
    return this.receiptCommandService.registerReceipt(dto);
  }

  @Put(':id/annul')
  @HttpCode(HttpStatus.OK)
  async annulReceipt(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { reason: string },
  ): Promise<SalesReceiptResponseDto> {
    return this.receiptCommandService.annulReceipt({ receiptId: id, reason: body.reason });
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async deleteReceipt(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<SalesReceiptDeletedResponseDto> {
    return this.receiptCommandService.deleteReceipt(id);
  }

  @Get()
  async listReceipts(
    @Query('page',  new DefaultValuePipe(1),  ParseIntPipe) page:  number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query() filters: ListSalesReceiptFilterDto,
  ): Promise<SalesReceiptSummaryListResponse> {
    const allowedLimits = [10, 20, 50, 100];

    if (!allowedLimits.includes(limit)) {
      throw new BadRequestException(
        `limit inválido. Valores permitidos: ${allowedLimits.join(', ')}.`,
      );
    }

    return this.receiptQueryService.listReceiptsSummary({ ...filters, page, limit });
  }

  @Get('autocomplete/customers')
  async autocompleteCustomers(
    @Query('search') search: string,
    @Query('sedeId') sedeId?: string,
  ): Promise<SalesReceiptAutocompleteResponseDto[]> {
    if (!search || search.trim().length < 2) {
      return [];
    }
    return this.receiptQueryService.autocompleteCustomers(
      search.trim(),
      sedeId ? Number(sedeId) : undefined,
    );
  }

  @Get('serie/:serie')
  async getReceiptsBySerie(
    @Param('serie') serie: string,
  ): Promise<SalesReceiptListResponse> {
    return this.receiptQueryService.getReceiptsBySerie(serie);
  }

  @Get('customer/:customerId/history')
  async getCustomerPurchaseHistory(
    @Param('customerId') customerId: string,
  ): Promise<CustomerPurchaseHistoryDto> {
    return this.receiptQueryService.getCustomerPurchaseHistory(customerId);
  }

  // ⚠️ SIEMPRE al final — captura cualquier :id numérico
  @Get(':id')
  async getReceipt(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<SalesReceiptWithHistoryDto> {
    return this.receiptQueryService.getReceiptWithHistory(id);
  @MessagePattern({ cmd: 'verify_sale' })
  async verifySaleForRemission(@Payload() id_comprobante: number) {
    const sale =
      await this.receiptQueryService.verifySaleForRemission(id_comprobante);
    return sale
      ? { success: true, data: sale }
      : { success: false, message: 'Venta no encontrada' };
  }

  @MessagePattern({ cmd: 'update_dispatch_status' })
  async updateDispatchStatus(
    @Payload() data: { id_venta: number; status: string },
  ) {
    const success = await this.receiptCommandService.updateDispatchStatus(
      data.id_venta,
      data.status,
    );
    return { success };
  }

  @MessagePattern({ cmd: 'find_sale_by_correlativo' })
  async findSaleByCorrelativo(@Payload() correlativo: string) {
    return await this.receiptQueryService.findSaleByCorrelativo(correlativo);
  }
}

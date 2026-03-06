import { Controller, Post, Get, Body } from '@nestjs/common';
import { SalesService } from './sales.service';
import { CreateSaleDto } from './core/dto/create-sale.dto';

@Controller('sales')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Post()
  async createSale(@Body() dto: CreateSaleDto) {
    return this.salesService.createSale(dto);
  }

  // GET /sales — lista comprobantes para despacho
  @Get()
  async getAllSales() {
    return this.salesService.getAllSales();
  }
}
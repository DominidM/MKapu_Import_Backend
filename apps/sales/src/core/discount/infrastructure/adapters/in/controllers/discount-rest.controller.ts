import { Controller, Post, Get, Put, Param, Body, Query, ParseIntPipe, Inject } from '@nestjs/common';
import { IDiscountCommandPort, IDiscountQueryPort } from '../../../../domain/ports/in/discount-ports-in';
import { CreateDiscountDto, UpdateDiscountDto } from '../../../../application/dto/in';

@Controller('discounts')
export class DiscountRestController {
    constructor(
    @Inject('IDiscountCommandPort')
    private readonly commandPort: IDiscountCommandPort,
    @Inject('IDiscountQueryPort')
    private readonly queryPort: IDiscountQueryPort,
    ) {}

  @Post()
  async create(@Body() dto: CreateDiscountDto) {
    return await this.commandPort.createDiscount(dto);
  }

  @Get()
  async list(@Query('page') page = 1, @Query('limit') limit = 10) {
    return await this.queryPort.listDiscounts(Number(page), Number(limit));
  }

  @Get('active')
  async listActive() {
    return await this.queryPort.listActiveDiscounts();
  }

  @Get(':id')
  async getById(@Param('id', ParseIntPipe) id: number) {
    return await this.queryPort.getDiscountById(id);
  }

  @Put(':id')
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateDiscountDto) {
    return await this.commandPort.updateDiscount(id, dto);
  }

  @Put(':id/status')
  async changeStatus(@Param('id', ParseIntPipe) id: number, @Body('activo') activo: boolean) {
    return await this.commandPort.changeStatus(id, activo);
  }
}
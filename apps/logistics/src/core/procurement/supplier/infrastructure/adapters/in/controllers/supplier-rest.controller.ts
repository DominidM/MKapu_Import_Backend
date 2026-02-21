// logistics/src/core/procurement/supplier/infrastructure/adapters/in/controllers/supplier-rest.controller.ts

import { Controller, Post, Put, Delete, Body, Param, HttpCode, HttpStatus, ParseIntPipe,
  Inject, Get, Query, } from '@nestjs/common';
import { ISupplierCommandPort, ISupplierQueryPort, } from '../../../../domain/ports/in/supplier-ports-in';
import { ChangeSupplierStatusDto, ListSupplierFilterDto, RegisterSupplierDto, UpdateSupplierDto, } from '../../../../application/dto/in';
import { SupplierDeletedResponseDto, SupplierListResponse, SupplierResponseDto, } from '../../../../application/dto/out';

@Controller('suppliers')
export class SupplierRestController {
  constructor(
    @Inject('ISupplierQueryPort')
    private readonly supplierQueryService: ISupplierQueryPort,
    @Inject('ISupplierCommandPort')
    private readonly supplierCommandService: ISupplierCommandPort,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async registerSupplier(
    @Body() registerDto: RegisterSupplierDto,
  ): Promise<SupplierResponseDto> {
    return this.supplierCommandService.registerSupplier(registerDto);
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  async updateSupplier(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: Omit<UpdateSupplierDto, 'id_proveedor'>,
  ): Promise<SupplierResponseDto> {
    const fullUpdateDto: UpdateSupplierDto = {
      ...updateDto,
      id_proveedor: id,
    };
    return this.supplierCommandService.updateSupplier(fullUpdateDto);
  }

  @Put(':id/status')
  @HttpCode(HttpStatus.OK)
  async changeSupplierStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() statusDto: { estado: boolean },
  ): Promise<SupplierResponseDto> {
    const changeStatusDto: ChangeSupplierStatusDto = {
      id_proveedor: id,
      estado: statusDto.estado,
    };
    return this.supplierCommandService.changeSupplierStatus(changeStatusDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async deleteSupplier(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<SupplierDeletedResponseDto> {
    return this.supplierCommandService.deleteSupplier(id);
  }

  @Get(':id')
  async getSupplier(@Param('id', ParseIntPipe) id: number) {
    return this.supplierQueryService.getSupplierById(id);
  }

  @Get()
  async listSuppliers(@Query() rawFilters: any): Promise<SupplierListResponse> {
    const filters: ListSupplierFilterDto = {};

    if (rawFilters.estado !== undefined) {
      filters.estado =
        rawFilters.estado === 'true' ||
        rawFilters.estado === '1' ||
        rawFilters.estado === true;
    }

    if (rawFilters.search !== undefined) {
      filters.search = String(rawFilters.search);
    }

    if (rawFilters.page !== undefined) {
      filters.page = Number(rawFilters.page);
    }

    if (rawFilters.limit !== undefined) {
      filters.limit = Number(rawFilters.limit);
    }

    return this.supplierQueryService.listSuppliers(filters);
  }
}

// infrastructure/adapters/in/controllers/caja-rest.controller.ts

import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  ParseIntPipe,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';

import { CreateCajaDto }          from '../../../../application/dto/in/create-caja.dto';
import { UpdateCajaPreciosDto }   from '../../../../application/dto/in/update-caja-precios.dto';
import { CajaCommandService } from '../../../../application/service/command/caja-command.service';
import { CajaQueryService } from '../../../../application/service/query/caja-query.service';

@Controller('cajas')
export class CajaRestController {
  constructor(
    private readonly command: CajaCommandService,
    private readonly query:   CajaQueryService,
  ) {}

  @Post()
  async create(@Body() dto: CreateCajaDto) {
    try {
      return await this.command.create(dto);
    } catch (err: any) {
      if (err instanceof BadRequestException) throw err;
      if (err instanceof Error) throw new BadRequestException(err.message);
      throw err;
    }
  }

  @Get(':id')
  async getById(@Param('id', ParseIntPipe) id: number) {
    try {
      return await this.query.getById(id);
    } catch (err: any) {
      if (err instanceof NotFoundException) throw err;
      if (err instanceof Error) throw new BadRequestException(err.message);
      throw err;
    }
  }

  @Get('producto/:id_producto')
  async getByProducto(@Param('id_producto', ParseIntPipe) id_producto: number) {
    return this.query.getByProducto(id_producto);
  }

  @Get('codigo/:cod_caja')
  async getByCodigo(@Param('cod_caja') cod_caja: string) {
    try {
      return await this.query.getByCodigo(cod_caja);
    } catch (err: any) {
      if (err instanceof NotFoundException) throw err;
      if (err instanceof Error) throw new BadRequestException(err.message);
      throw err;
    }
  }

  @Put(':id/precios')
  async updatePrecios(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCajaPreciosDto,
  ) {
    try {
      return await this.command.updatePrecios(id, dto);
    } catch (err: any) {
      if (err instanceof NotFoundException || err instanceof BadRequestException) throw err;
      if (err instanceof Error) throw new BadRequestException(err.message);
      throw err;
    }
  }

  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number) {
    try {
      await this.command.delete(id);
      return { ok: true };
    } catch (err: any) {
      if (err instanceof NotFoundException) throw err;
      if (err instanceof Error) throw new BadRequestException(err.message);
      throw err;
    }
  }
}
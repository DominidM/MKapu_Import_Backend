/* eslint-disable @typescript-eslint/no-unsafe-return */

import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Inject,
  ParseIntPipe,
} from '@nestjs/common';
import {
  DispatchCommandPortIn,
  DispatchQueryPortIn,
} from '../../../../domain/ports/in/dispatch-ports-in';
import { CreateDispatchDto } from '../../../../application/dto/in/dispatch-dto-in';
import { DispatchDtoOut } from '../../../../application/dto/out/dispatch-dto-out';
import { UpdateDispatchDto } from '../../../../application/dto/in/update-dispatch-dto';

@Controller('dispatch')
export class DispatchRestController {
  constructor(
    @Inject('DispatchCommandPortIn')
    private readonly commandService: DispatchCommandPortIn,
    @Inject('DispatchQueryPortIn')
    private readonly queryService: DispatchQueryPortIn,
  ) {}

  @Post()
  async create(@Body() dto: CreateDispatchDto): Promise<DispatchDtoOut> {
    return await this.commandService.createDispatch(dto);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateDispatchDto,
  ): Promise<DispatchDtoOut> {
    dto.id_despacho = id;
    return await this.commandService.updateDispatch(dto);
  }

  @Get()
  async findAll(): Promise<DispatchDtoOut[]> {
    return await this.queryService.getDispatches();
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<DispatchDtoOut> {
    return await this.queryService.getDispatchById(id);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.commandService.deleteDispatch(id);
  }
}

/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';

import { RemissionCommandService } from '../../../../application/service/remission-command.service';
import { CreateRemissionDto } from '../../../../application/dto/in/create-remission.dto';
import { JwtAuthGuard } from '@app/common/infrastructure/guard/jwt-auth.guard';
import { RoleGuard } from '@app/common/infrastructure/guard/roles.guard';
import { Roles } from '@app/common';

@Controller('remission')
@UseGuards(JwtAuthGuard, RoleGuard)
export class RemissionController {
  constructor(private readonly service: RemissionCommandService) {}

  @Post()
  @Roles('ADMIN', 'LOGISTICS_MANAGER')
  async create(@Body() dto: CreateRemissionDto) {
    return await this.service.createRemission(dto);
  }
  @Get('sale/:correlativo')
  async findSale(@Param('correlativo') correlativo: string) {
    // Llamamos al service que a su vez usará el gateway TCP
    return await this.service.buscarVentaParaRemitir(correlativo);
  }
}

import { Body, Controller, Post, UseGuards } from '@nestjs/common';

import { RemissionCommandService } from '../../../../application/service/remission-command.service';
import { CreateRemissionDto } from '../../../../application/dto/in/create-remission.dto';
import { RoleGuard, Roles } from 'libs/common/src';
import { JwtAuthGuard } from 'libs/common/src/infrastructure/guard/jwt-auth.guard';

@Controller('remission')
@UseGuards(JwtAuthGuard, RoleGuard)
export class RemissionController {
  constructor(private readonly service: RemissionCommandService) {}

  @Post()
  @Roles('GP_GESTION_GUIAS') // Paso 1: Valida permisos
  async create(@Body() dto: CreateRemissionDto) {
    return await this.service.createRemission(dto);
  }
}

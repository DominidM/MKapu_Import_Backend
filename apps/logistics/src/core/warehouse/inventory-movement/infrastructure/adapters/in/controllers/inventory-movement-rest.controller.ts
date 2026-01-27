import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { RoleGuard } from 'libs/common/src/infrastructure/guard/roles.guard';
import { Roles } from 'libs/common/src/infrastructure/decorators/roles.decorators';
import { InventoryMovementCommandService } from '../../../../application/service/inventory-movement-command.service';
import { RegisterMovementDto } from '../../../../application/dto/in/register-movement.dto';

@Controller('inventory-movements')
@UseGuards(RoleGuard)
export class InventoryMovementRestController {
  constructor(
    private readonly commandService: InventoryMovementCommandService,
  ) {}

  @Post('income')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.CREATED)
  async registerIncome(@Body() dto: RegisterMovementDto) {
    await this.commandService.registerIncome(dto);

    return {
      message: 'Ingreso de mercadería registrado exitosamente',
      data: {
        reference: `${dto.refTable} #${dto.refId}`,
      },
    };
  }
}

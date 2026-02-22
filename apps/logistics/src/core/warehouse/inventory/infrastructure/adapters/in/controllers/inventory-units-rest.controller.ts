import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { RoleGuard } from 'libs/common/src/infrastructure/guard/roles.guard';
import { Roles } from 'libs/common/src/infrastructure/decorators/roles.decorators';
import { GetUnitsAvailabilityQueryDto } from '../../../../application/dto/in/get-units-availability-query.dto';
import { UnitsAvailabilityResponseDto } from '../../../../application/dto/out/units-availability-response.dto';
import { InventoryQueryService } from '../../../../application/service/inventory-query.service';

@Controller('warehouse/inventory/units')
@UseGuards(RoleGuard)
export class InventoryUnitsRestController {
  constructor(private readonly queryService: InventoryQueryService) {}

  @Get('availability')
  @Roles('ADMINISTRADOR')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async getAvailability(
    @Query() query: GetUnitsAvailabilityQueryDto,
  ): Promise<UnitsAvailabilityResponseDto> {
    return this.queryService.getSerializedUnitsAvailability(
      query.productId,
      query.warehouseId,
    );
  }
}

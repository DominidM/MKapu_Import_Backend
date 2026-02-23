import { Body, Controller, Param, Patch } from '@nestjs/common';
import { UnitCommandService } from '../../../application/service/unit-command.service';
import { ChangeUnitStatusDto } from '../../../application/dto/in/update-unit-dto';

@Controller('units')
export class UnitRestController {
  constructor(private readonly unitService: UnitCommandService) {}

  @Patch('status/bulk')
  async changeStatus(@Body() dto: ChangeUnitStatusDto) {
    return await this.unitService.changeStatus(dto);
  }

  @Patch('status/bulk/:id')
  async changeStatusWithTransferId(
    @Param('id') id: string,
    @Body() dto: ChangeUnitStatusDto,
  ) {
    dto.transferId = Number(id);
    return await this.unitService.changeStatus(dto);
  }
}

import { Body, Controller, Post } from '@nestjs/common';
import { StockService } from '../../../../application/service/stock.service';
import { StockMovementDto } from '../../../../application/dto/in/stock-movement.dto';

@Controller('stock')
export class StockController {
  constructor(private readonly stockService: StockService) {}

  @Post('movement')
  async applyMovement(@Body() dto: StockMovementDto) {
    await this.stockService.applyMovement(
      dto.productId,
      dto.warehouseId,
      dto.headquartersId,
      dto.quantityDelta,
      dto.reason,
    );

    return { success: true };
  }
}
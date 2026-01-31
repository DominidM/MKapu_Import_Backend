/* marketing/src/core/promotion/infrastructure/adapters/in/controllers/promotion-rest.controller.ts */

import { 
  Controller, 
  Post, 
  Put, 
  Delete, 
  Body, 
  Param, 
  Inject, 
  ParseIntPipe, 
  Get 
} from '@nestjs/common';
import { 
  IPromotionCommandPort, 
  IPromotionQueryPort 
} from '../../../../domain/ports/in/promotion-ports-in';

@Controller('promotions')
export class PromotionRestController {
  constructor(
    @Inject('IPromotionCommandPort') 
    private readonly commandPort: IPromotionCommandPort,
    
    @Inject('IPromotionQueryPort') 
    private readonly queryPort: IPromotionQueryPort,
  ) {}

  @Post()
  async register(@Body() dto: any) {
    return await this.commandPort.registerPromotion(dto);
  }

  @Get()
  async list() {
    return await this.queryPort.listPromotions();
  }

  @Get('active')
  async listActive() {
    return await this.queryPort.getActivePromotions();
  }

  @Get(':id')
  async getById(@Param('id', ParseIntPipe) id: number) {
    return await this.queryPort.getPromotionById(id);
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number, 
    @Body() dto: any
  ) {
    return await this.commandPort.updatePromotion(id, dto);
  }

  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number) {
    return await this.commandPort.deletePromotion(id);
  }
}
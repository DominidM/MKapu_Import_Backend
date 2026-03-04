import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  RequestTransferDto,
  TransferCommandPortIn,
  TransferQueryPortIn,
} from '../../../../domain/ports/in/transfer-ports-in';
import { Transfer } from '../../../../domain/entity/transfer-domain-entity';
import { RejectTransferDto } from '../../../../application/dto/in/reject-transfer.dto';

@Controller('warehouse/transfer')
export class TransferRestController {
  constructor(
    @Inject('TransferCommandPortIn')
    private readonly transferCommandService: TransferCommandPortIn,

    @Inject('TransferQueryPortIn')
    private readonly transferQueryService: TransferQueryPortIn,
  ) {}

  @Post('request')
  @UsePipes(new ValidationPipe())
  async requestTransfer(@Body() dto: RequestTransferDto): Promise<Transfer> {
    return await this.transferCommandService.requestTransfer(dto);
  }

  @Patch(':id/approve')
  async approveTransfer(
    @Param('id') id: number,
    @Body('userId') userId: number,
  ): Promise<Transfer> {
    return await this.transferCommandService.approveTransfer(id, userId);
  }

  @Patch(':id/reject')
  async rejectTransfer(
    @Param('id') id: number,
    @Body() dto: RejectTransferDto,
  ): Promise<Transfer> {
    return await this.transferCommandService.rejectTransfer(
      id,
      dto.userId,
      dto.reason,
    );
  }

  @Patch(':id/confirm-receipt')
  async confirmReceipt(
    @Param('id') id: number,
    @Body('userId') userId: number,
  ): Promise<Transfer> {
    return await this.transferCommandService.confirmReceipt(id, userId);
  }

  // --- CONSULTAS (Lectura) ---

  @Get('headquarters/:hqId')
  async getTransfersByHeadquarters(
    @Param('hqId') hqId: string,
  ): Promise<Transfer[]> {
    return await this.transferQueryService.getTransfersByHeadquarters(hqId);
  }

  @Get()
  async getAllTransfers(): Promise<Transfer[]> {
    return await this.transferQueryService.getAllTransfers();
  }

  @Get(':id')
  async getTransferById(@Param('id') id: number): Promise<Transfer> {
    return await this.transferQueryService.getTransferById(id);
  }
}

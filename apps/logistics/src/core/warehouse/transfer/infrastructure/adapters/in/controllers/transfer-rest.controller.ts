import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { TransferPortsIn } from '../../../../domain/ports/in/transfer-ports-in';
import { RejectTransferDto } from '../../../../application/dto/in/reject-transfer.dto';
import { RequestTransferDto } from '../../../../application/dto/in/request-transfer.dto';
import { ApproveTransferDto } from '../../../../application/dto/in/approve-transfer.dto';
import { ConfirmReceiptTransferDto } from '../../../../application/dto/in/confirm-receipt-transfer.dto';
import { RoleGuard } from 'libs/common/src/infrastructure/guard/roles.guard';
import { Roles } from 'libs/common/src/infrastructure/decorators/roles.decorators';
import {
  TransferByIdResponseDto,
  TransferListResponseDto,
  TransferResponseDto,
} from '../../../../application/dto/out';

@Controller('warehouse/transfer')
@UseGuards(RoleGuard)
export class TransferRestController {
  constructor(
    @Inject('TransferPortsIn')
    private readonly transferService: TransferPortsIn,
  ) {}
  @Post('request')
  @Roles('JEFE DE ALMACEN')
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async requestTransfer(@Body() dto: RequestTransferDto): Promise<TransferResponseDto> {
    return await this.transferService.requestTransfer(dto);
  }
  @Patch(':id/approve')
  @Roles('ADMINISTRADOR')
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async approveTransfer(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ApproveTransferDto,
  ): Promise<TransferResponseDto> {
    return await this.transferService.approveTransfer(id, dto);
  }
  @Patch(':id/reject')
  @Roles('ADMINISTRADOR')
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async rejectTransfer(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RejectTransferDto,
  ): Promise<TransferResponseDto> {
    return await this.transferService.rejectTransfer(id, dto);
  }
  @Patch(':id/confirm-receipt')
  @Roles('ADMINISTRADOR')
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async confirmReceipt(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ConfirmReceiptTransferDto,
  ): Promise<TransferResponseDto> {
    return await this.transferService.confirmReceipt(id, dto);
  }

  @Get('headquarters/:hqId')
  async getTransfersByHeadquarters(
    @Param('hqId') hqId: string,
  ): Promise<TransferResponseDto[]> {
    return await this.transferService.getTransfersByHeadquarters(hqId);
  }
  @Get()
  async getAllTransfers(): Promise<TransferListResponseDto[]> {
    return await this.transferService.getAllTransfers();
  }
  @Get(':id')
  async getTransferById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<TransferByIdResponseDto> {
    return await this.transferService.getTransferById(id);
  }
}

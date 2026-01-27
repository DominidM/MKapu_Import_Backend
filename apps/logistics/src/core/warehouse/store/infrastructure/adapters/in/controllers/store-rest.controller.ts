import {
  Controller,
  Post,
  Put,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  Inject,
  Get,
  Query,
} from '@nestjs/common';
import {
  IStoreCommandPort,
  IStoreQueryPort,
} from '../../../../domain/ports/in/store-port-in';
import {
  ChangeStoreStatusDto,
  ListStoreFilterDto,
  RegisterStoreDto,
  UpdateStoreDto,
} from '../../../../application/dto/in';
import {
  StoreDeletedResponseDto,
  StoreListResponse,
  StoreResponseDto,
} from '../../../../application/dto/out';

@Controller('stores')
export class StoreRestController {
  constructor(
    @Inject('IStoreQueryPort')
    private readonly storeQueryService: IStoreQueryPort,
    @Inject('IStoreCommandPort')
    private readonly storeCommandService: IStoreCommandPort,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async registerStore(
    @Body() registerDto: RegisterStoreDto,
  ): Promise<StoreResponseDto> {
    return this.storeCommandService.registerStore(registerDto);
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  async updateStore(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: Omit<UpdateStoreDto, 'id_almacen'>,
  ): Promise<StoreResponseDto> {
    const fullUpdateDto: UpdateStoreDto = {
      ...updateDto,
      id_almacen: id,
    };
    return this.storeCommandService.updateStore(fullUpdateDto);
  }

  @Put(':id/status')
  @HttpCode(HttpStatus.OK)
  async changeStoreStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() statusDto: { activo: boolean },
  ): Promise<StoreResponseDto> {
    const changeStatusDto: ChangeStoreStatusDto = {
      id_almacen: id,
      activo: statusDto.activo,
    };
    return this.storeCommandService.changeStoreStatus(changeStatusDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async deleteStore(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<StoreDeletedResponseDto> {
    return this.storeCommandService.deleteStore(id);
  }

  @Get(':id')
  async getStore(@Param('id', ParseIntPipe) id: number) {
    return this.storeQueryService.getStoreById(id);
  }

  @Get()
  async listStores(
    @Query() filters: ListStoreFilterDto,
  ): Promise<StoreListResponse> {
    return this.storeQueryService.listStores(filters);
  }
}

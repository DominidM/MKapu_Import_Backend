import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Delete,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { ProductCommandService } from '../../../../application/service/product-command.service';
import { ProductQueryService } from '../../../../application/service/product-query.service';
import {
  RegisterProductDto,
  UpdateProductDto,
  UpdateProductPricesDto,
  ChangeProductStatusDto,
  ListProductFilterDto,
} from '../../../../application/dto/in';

@Controller('products')
export class ProductRestController {
  constructor(
    private readonly commandService: ProductCommandService,
    private readonly queryService: ProductQueryService,
  ) {}

  // ===============================
  // Commands
  // ===============================

  @Post()
  async register(@Body() dto: RegisterProductDto) {
    return this.commandService.registerProduct(dto);
  }

  @Put()
  async update(@Body() dto: UpdateProductDto) {
    return this.commandService.updateProduct(dto);
  }

  @Put('prices')
  async updatePrices(@Body() dto: UpdateProductPricesDto) {
    return this.commandService.updateProductPrices(dto);
  }

  @Put('status')
  async changeStatus(@Body() dto: ChangeProductStatusDto) {
    return this.commandService.changeProductStatus(dto);
  }

  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number) {
    return this.commandService.deleteProduct(id);
  }

  // ===============================
  // Queries
  // ===============================

  @Get()
  async list(@Query() filters: ListProductFilterDto) {
    return this.queryService.listProducts(filters);
  }

  @Get(':id')
  async getById(@Param('id', ParseIntPipe) id: number) {
    return this.queryService.getProductById(id);
  }

  @Get('code/:codigo')
  async getByCode(@Param('codigo') codigo: string) {
    return this.queryService.getProductByCode(codigo);
  }

  @Get('category/:id_categoria')
  async getByCategory(@Param('id_categoria', ParseIntPipe) id_categoria: number) {
    return this.queryService.getProductsByCategory(id_categoria);
  }
}

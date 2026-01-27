
/* ============================================
   APPLICATION LAYER - COMMAND SERVICE
   logistics/src/core/catalog/product/application/service/product-command.service.ts
   ============================================ */

import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { IProductCommandPort } from '../../domain/ports/in/product-port-in';
import { IProductRepositoryPort } from '../../domain/ports/out/product-ports-out';
import {
  RegisterProductDto,
  UpdateProductDto,
  UpdateProductPricesDto,
  ChangeProductStatusDto,
} from '../dto/in';
import {
  ProductResponseDto,
  ProductDeletedResponseDto,
} from '../dto/out';
import { ProductMapper } from '../mapper/product.mapper';

@Injectable()
export class ProductCommandService implements IProductCommandPort {
  constructor(
    @Inject('IProductRepositoryPort')
    private readonly repository: IProductRepositoryPort,
  ) {}

  async registerProduct(dto: RegisterProductDto): Promise<ProductResponseDto> {
    // Validar que el código sea único
    const existsByCode = await this.repository.existsByCode(dto.codigo);
    if (existsByCode) {
      throw new ConflictException('Ya existe un producto con ese código');
    }

    // Validar que los precios sean lógicos
    if (dto.pre_venta < dto.pre_compra) {
      throw new BadRequestException('El precio de venta no puede ser menor al precio de compra');
    }

    if (dto.pre_unit <= 0 || dto.pre_may <= 0 || dto.pre_caja <= 0) {
      throw new BadRequestException('Los precios deben ser mayores a cero');
    }

    const product = ProductMapper.fromRegisterDto(dto);
    const savedProduct = await this.repository.save(product);
    return ProductMapper.toResponseDto(savedProduct);
  }

  async updateProduct(dto: UpdateProductDto): Promise<ProductResponseDto> {
    const existingProduct = await this.repository.findById(dto.id_producto);
    if (!existingProduct) {
      throw new NotFoundException(`Producto con ID ${dto.id_producto} no encontrado`);
    }

    if (dto.codigo && dto.codigo !== existingProduct.codigo) {
      const codeExists = await this.repository.existsByCode(dto.codigo);
      if (codeExists) {
        throw new ConflictException('El código ya está en uso por otro producto');
      }
    }

    const updatedProduct = ProductMapper.fromUpdateDto(existingProduct, dto);
    const savedProduct = await this.repository.update(updatedProduct);
    return ProductMapper.toResponseDto(savedProduct);
  }

  async updateProductPrices(dto: UpdateProductPricesDto): Promise<ProductResponseDto> {
    const existingProduct = await this.repository.findById(dto.id_producto);
    if (!existingProduct) {
      throw new NotFoundException(`Producto con ID ${dto.id_producto} no encontrado`);
    }

    // Validar lógica de precios
    const newSalePrice = dto.pre_venta ?? existingProduct.pre_venta;
    const newPurchasePrice = dto.pre_compra ?? existingProduct.pre_compra;

    if (newSalePrice < newPurchasePrice) {
      throw new BadRequestException('El precio de venta no puede ser menor al precio de compra');
    }

    const updatedProduct = ProductMapper.fromUpdatePricesDto(existingProduct, dto);
    const savedProduct = await this.repository.update(updatedProduct);
    return ProductMapper.toResponseDto(savedProduct);
  }

  async changeProductStatus(dto: ChangeProductStatusDto): Promise<ProductResponseDto> {
    const existingProduct = await this.repository.findById(dto.id_producto);
    if (!existingProduct) {
      throw new NotFoundException(`Producto con ID ${dto.id_producto} no encontrado`);
    }

    const updatedProduct = ProductMapper.withStatus(existingProduct, dto.estado);
    const savedProduct = await this.repository.update(updatedProduct);
    return ProductMapper.toResponseDto(savedProduct);
  }

  async deleteProduct(id: number): Promise<ProductDeletedResponseDto> {
    const existingProduct = await this.repository.findById(id);
    if (!existingProduct) {
      throw new NotFoundException(`Producto con ID ${id} no encontrado`);
    }

    await this.repository.delete(id);
    return ProductMapper.toDeletedResponse(id);
  }
}

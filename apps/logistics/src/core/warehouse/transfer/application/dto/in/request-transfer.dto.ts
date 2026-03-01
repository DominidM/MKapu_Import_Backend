import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsInt,
  IsNotEmpty,
  Min,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class RequestTransferItemDto {
  @Type(() => Number)
  @IsInt()
  @IsNotEmpty()
  productId: number;

  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  series?: string[];

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity?: number;
}

export class RequestTransferDto {
  @IsString()
  @IsNotEmpty()
  originHeadquartersId: string;

  @Type(() => Number)
  @IsInt()
  @IsNotEmpty()
  originWarehouseId: number;

  @IsString()
  @IsNotEmpty()
  destinationHeadquartersId: string;

  @Type(() => Number)
  @IsInt()
  @IsNotEmpty()
  destinationWarehouseId: number;

  @IsOptional()
  @IsString()
  observation?: string;

  @Type(() => Number)
  @IsInt()
  @IsNotEmpty()
  userId: number;

  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => RequestTransferItemDto)
  items: RequestTransferItemDto[];

  @IsOptional()
  @IsString()
  transferMode?: string;
}

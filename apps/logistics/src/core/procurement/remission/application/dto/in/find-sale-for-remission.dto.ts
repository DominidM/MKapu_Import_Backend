import { IsNotEmpty, IsString, IsInt } from 'class-validator';

export class FindSaleForRemissionDto {
  @IsNotEmpty()
  @IsString()
  serie: string;

  @IsNotEmpty()
  @IsInt()
  numero: number;
}

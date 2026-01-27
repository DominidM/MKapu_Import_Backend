import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class RejectTransferDto {
  @IsNumber()
  @IsNotEmpty()
  userId: number;

  @IsString()
  @IsNotEmpty()
  reason: string;
}

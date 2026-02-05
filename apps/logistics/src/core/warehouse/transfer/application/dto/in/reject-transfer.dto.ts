import { IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { Column } from 'typeorm';

export class RejectTransferDto {
  @IsNumber()
  @IsNotEmpty()
  userId: number;

  @IsString()
  @IsNotEmpty()
  reason: string;


  @Column({ 
    name: 'fec_transf', 
    type: 'datetime', 
    default: () => 'CURRENT_TIMESTAMP' // Para que no falle si el DTO no envía fecha
  })
  date: Date;
}

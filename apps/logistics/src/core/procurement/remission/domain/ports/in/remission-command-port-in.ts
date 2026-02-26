import { CreateRemissionDto } from '../../../application/dto/in/create-remission.dto';

export interface RemissionCommandPortIn {
  createRemission(dto: CreateRemissionDto);
  searchSaleToForward(correlativo: string);
}

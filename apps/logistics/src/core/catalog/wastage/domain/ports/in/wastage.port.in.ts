import { CreateWastageDto } from '../../../application/dto/in/create-wastage.dto';
import { UpdateWastageDto } from '../../../application/dto/in/update-wastage.dto';
import { WastageResponseDto, WastagePaginatedResponseDto } from '../../../application/dto/out/wastage-response.dto';

export interface IWastageCommandPort {
  create(dto: CreateWastageDto): Promise<WastageResponseDto>;
  update(id: number, dto: UpdateWastageDto): Promise<WastageResponseDto>;
}

export interface IWastageQueryPort {
  findAll(): Promise<WastageResponseDto[]>;
  findAllPaginated(page: number, limit: number, id_sede?: number): Promise<WastagePaginatedResponseDto>; 
  findById(id: number): Promise<WastageResponseDto>;
}

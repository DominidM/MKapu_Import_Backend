import { CreateWastageDto } from '../../../application/dto/in/create-wastage.dto';
import { WastageResponseDto } from '../../../application/dto/out/wastage-response.dto';

// Para el Command Service
export interface IWastageCommandPort {
  create(dto: CreateWastageDto): Promise<WastageResponseDto>;
}

// Para el Query Service
export interface IWastageQueryPort {
  findById(id: number): Promise<WastageResponseDto | null>;
  findAll(): Promise<WastageResponseDto[]>;
}
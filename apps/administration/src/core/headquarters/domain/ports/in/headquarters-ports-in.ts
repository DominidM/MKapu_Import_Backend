import { ChangeHeadquartersDto } from "../../../application/dto/in/change-headquarters-dto";
import { ListHeadquartersFilterDto } from "../../../application/dto/in/list-headquarters-filter-dto";
import { RegisterHeadquartersDto } from "../../../application/dto/in/register-headquarters-dto";
import { UpdateHeadquartersDto } from "../../../application/dto/in/update-headquarters-dto";
import { HeadquartersDeletedResponseDto } from "../../../application/dto/out/headquarters-deleted-response-dto";
import { HeadquartersListResponse } from "../../../application/dto/out/headquarters-list-response";
import { HeadquartersResponseDto } from "../../../application/dto/out/headquarters-response-dto";

/*  administration/src/core/headquarters/domain/ports/in/headquarters-ports-in.ts */
export interface IHeadquartersCommandPort {
    registerHeadquarter(dto: RegisterHeadquartersDto): Promise<HeadquartersResponseDto>;
    updateHeadquarter(dto: UpdateHeadquartersDto): Promise<HeadquartersResponseDto>;
    changeHeadquarterStatus(dto: ChangeHeadquartersDto): Promise<HeadquartersResponseDto>;
    deleteHeadquarter(id_sede: number): Promise<HeadquartersDeletedResponseDto>;
}

export interface IHeadquartersQueryPort {
    listHeadquarters(filters?: ListHeadquartersFilterDto): Promise<HeadquartersListResponse>;
    getHeadquarterById(id: number): Promise<HeadquartersResponseDto | null>;
    getHeadquarterByCode(code: string): Promise<HeadquartersResponseDto | null>;
    getHeadquarterByName(name: string): Promise<HeadquartersResponseDto | null>;
}
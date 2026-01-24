//appliaction/dto/out/headquarters-list-response.ts
/* ============================================
   administration/src/core/headquarters/application/dto/out/headquarters-list-response.ts
   ============================================ */

import { HeadquartersResponseDto } from "./headquarters-response-dto";

export interface HeadquartersListResponse {
   headquarters: HeadquartersResponseDto[];
   total: number;
   page?: number;
   pageSize?: number;
}
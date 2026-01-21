
/* ============================================
   administration/src/core/role/application/dto/out/role-list-response.ts
   ============================================ */

import { RoleResponseDto } from './role-response-dto';

export interface RoleListResponse {
  roles: RoleResponseDto[];
  total: number;
}

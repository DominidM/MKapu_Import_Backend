import { IsInt, IsArray, IsPositive } from 'class-validator';
import { Type } from 'class-transformer';

export class SyncPermissionsDto {
  @IsInt() @IsPositive() @Type(() => Number)
  roleId: number;

  @IsArray() @IsInt({ each: true })
  permissionIds: number[]; // puede ser [] para dejar sin permisos
}
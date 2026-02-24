/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  ExecutionContext,
  Injectable,
  CanActivate,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorators';

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  private readonly rolePermissions = {
    VENDEDOR: [
      'REGISTRAR_VENTA',
      'GENERAR_COTIZACION',
      'BUSCAR_PRODUCTOS',
      'REGISTRAR_RECLAMO',
      'REGISTRAR_GARANTIA',
    ],
    CAJERO: [
      'ABRIR_CAJA',
      'CERRAR_CAJA',
      'GESTIONAR_CAJA_CHICA',
      'GENERAR_COTIZACION',
      'BUSCAR_PRODUCTOS',
    ],
    ALMACENERO: [
      'VER_STOCK',
      'REGISTRAR_ENTRADA',
      'REGISTRAR_SALIDA',
      'VER_MOVIMIENTOS',
      'CLASIFICAR_PRODUCTO',
    ],
    'JEFE DE ALMACEN': [
      'VER_STOCK',
      'REGISTRAR_ENTRADA',
      'REGISTRAR_SALIDA',
      'APROBAR_GARANTIA',
      'VER_MOVIMIENTOS',
    ],
    ADMINISTRADOR: ['*'],
  };

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const userRoles = this.extractRoles(request);

    if (!userRoles.length) {
      throw new ForbiddenException(
        'El usuario no tiene roles asignados o no esta autenticado',
      );
    }

    const normalizedRequiredRoles = requiredRoles
      .map((role) => this.normalizeRole(role))
      .filter(Boolean);

    const hasRole = userRoles.some((role) =>
      normalizedRequiredRoles.includes(this.normalizeRole(role)),
    );

    if (!hasRole) {
      throw new ForbiddenException(
        `Se requiere uno de estos roles: ${requiredRoles.join(', ')}`,
      );
    }

    return true;
  }

  private extractRoles(request: any): string[] {
    const rolesFromUser = request?.user?.roles;

    if (Array.isArray(rolesFromUser) && rolesFromUser.length > 0) {
      return rolesFromUser
        .map((role) => {
          if (typeof role === 'string') return role;
          if (role && typeof role === 'object') {
            return role.nombre ?? role.name ?? role.role ?? '';
          }
          return '';
        })
        .filter((role) => typeof role === 'string' && role.trim().length > 0);
    }

    const singleUserRole =
      request?.user?.role ??
      request?.user?.roleName ??
      request?.user?.rol ??
      request?.user?.nombreRol;

    if (typeof singleUserRole === 'string' && singleUserRole.trim()) {
      return [singleUserRole];
    }

    const roleHeader = request?.headers?.['x-role'];

    if (Array.isArray(roleHeader)) {
      return roleHeader
        .map((role) => String(role).trim())
        .filter((role) => role.length > 0);
    }

    if (typeof roleHeader === 'string') {
      return roleHeader
        .split(',')
        .map((role) => role.trim())
        .filter((role) => role.length > 0);
    }

    return [];
  }

  private normalizeRole(value: string): string {
    return String(value ?? '').trim().toUpperCase();
  }
}

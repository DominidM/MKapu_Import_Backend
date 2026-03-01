import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class InternalSecretGuard implements CanActivate {
  private readonly logger = new Logger(InternalSecretGuard.name);

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    try {
      const payload = context.getArgByIndex(0) as any;
      const secretIn = payload?.secret;

      // Verificar que el secret exista y esté configurado
      const expectedSecret = process.env.INTERNAL_COMM_SECRET;

      if (!expectedSecret) {
        this.logger.error(
          '🚨 INTERNAL_COMM_SECRET no está configurado en variables de entorno',
        );
        return false;
      }

      if (!secretIn) {
        this.logger.warn('⚠️ Llamada TCP bloqueada: secret no proporcionado');
        return false;
      }

      const isValid = secretIn === expectedSecret;

      if (!isValid) {
        this.logger.warn(
          '⚠️ Llamada TCP bloqueada: INTERNAL_COMM_SECRET inválido',
        );
      }

      return isValid;
    } catch (err: any) {
      this.logger.error(
        `❌ Error validando secret interno: ${err?.message}`,
        err?.stack,
      );
      return false;
    }
  }
}

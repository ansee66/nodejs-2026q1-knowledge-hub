import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { UserRole } from '@prisma/client';
import { API_MESSAGES } from 'src/common/constants/api-messages.constants';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}
  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();

    const user = request.user;
    const method = request.method;

    if (!user) {
      return false;
    }

    if (user.role === UserRole.ADMIN) {
      return true;
    }

    if (user.role === UserRole.VIEWER) {
      if (method !== 'GET') {
        throw new ForbiddenException(API_MESSAGES.ROLES.VIEWER_LIMITATIONS);
      }
      return true;
    }

    if (user.role === UserRole.EDITOR) {
      return true;
    }

    throw new ForbiddenException(API_MESSAGES.ROLES.FORBIDDEN);
  }
}

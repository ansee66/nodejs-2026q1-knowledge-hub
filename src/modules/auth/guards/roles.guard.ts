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
import { ROLES_KEY } from '../decorators/roles.decorator';

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

    if (user.role === UserRole.admin) {
      return true;
    }

    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) return true;

    const isOwnPasswordUpdate =
      method === 'PUT' && request.params?.id && request.params.id === user.id;

    if (isOwnPasswordUpdate) {
      return true;
    }

    if (!requiredRoles.includes(user.role)) {
      throw new ForbiddenException(API_MESSAGES.ROLES.FORBIDDEN);
    }

    return true;
  }
}

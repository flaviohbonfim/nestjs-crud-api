import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles) {
      return true; // No roles required, access granted
    }
    const { user } = context.switchToHttp().getRequest();

    // Check if user object and user.role exist
    if (!user || !user.role) {
      return false; // No user or role on request, deny access
    }

    return requiredRoles.some((role) => user.role === role);
  }
}

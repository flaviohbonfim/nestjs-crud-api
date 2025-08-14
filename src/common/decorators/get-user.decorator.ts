import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from '../../users/user.entity';
import { Request } from 'express';

interface AuthRequest extends Request {
  user: User;
}

export const GetUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): User => {
    const request = ctx.switchToHttp().getRequest<AuthRequest>();
    return request.user;
  },
);

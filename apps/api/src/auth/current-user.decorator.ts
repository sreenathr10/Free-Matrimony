import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { AuthedRequest } from './jwt.guard';

export const CurrentUser = createParamDecorator(
  (_: unknown, ctx: ExecutionContext) => ctx.switchToHttp().getRequest<AuthedRequest>().user,
);

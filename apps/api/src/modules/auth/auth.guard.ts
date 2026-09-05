import { Injectable, type CanActivate, type ExecutionContext } from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import { Unauthorized } from '../../common/errors/domain.error.js';
import { AuthService } from './auth.service.js';

export const SESSION_COOKIE = 'kb_session';

/**
 * Один способ аутентификации на весь HTTP: кука сессии, с запасным вариантом
 * Bearer для служебных клиентов и тестов.
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly auth: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<FastifyRequest>();
    const token = readToken(request);
    if (!token) throw new Unauthorized();

    const user = await this.auth.validate(token);
    if (!user) throw new Unauthorized('Сессия истекла. Войди заново.');

    request.user = user;
    return true;
  }
}

export function readToken(request: FastifyRequest): string | null {
  const cookie = request.cookies?.[SESSION_COOKIE];
  if (cookie) return cookie;

  const header = request.headers.authorization;
  if (header?.startsWith('Bearer ')) return header.slice('Bearer '.length);

  return null;
}

import { loginRequestSchema, registerRequestSchema } from '@kobold/contracts';
import { Body, Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { zodBody } from '../../common/validation/zod-validation.pipe.js';
import { AuthGuard, SESSION_COOKIE, readToken } from './auth.guard.js';
import { AuthService } from './auth.service.js';
import { CurrentUser, type AuthenticatedUser } from './current-user.decorator.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('register')
  async register(
    @Body(zodBody(registerRequestSchema))
    body: {
      email: string;
      password: string;
      currency: string;
    },
  ) {
    const user = await this.auth.register(body);
    return { id: user.id, email: user.email };
  }

  @Post('login')
  async login(
    @Body(zodBody(loginRequestSchema)) body: { email: string; password: string },
    @Req() request: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ) {
    const { token, user } = await this.auth.login(body, {
      userAgent: request.headers['user-agent'],
      ip: request.ip,
    });

    void reply.setCookie(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 30 * 24 * 60 * 60,
    });

    return { user };
  }

  @Post('logout')
  @UseGuards(AuthGuard)
  async logout(@Req() request: FastifyRequest, @Res({ passthrough: true }) reply: FastifyReply) {
    const token = readToken(request);
    if (token) await this.auth.logout(token);
    void reply.clearCookie(SESSION_COOKIE, { path: '/' });
    return { ok: true };
  }

  @Get('session')
  @UseGuards(AuthGuard)
  session(@CurrentUser() user: AuthenticatedUser) {
    return { user };
  }
}

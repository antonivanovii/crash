import { ERROR_CODES, type ApiErrorBody } from '@kobold/contracts';
import {
  Catch,
  HttpException,
  Logger,
  type ArgumentsHost,
  type ExceptionFilter,
} from '@nestjs/common';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { DomainError } from './domain.error.js';

/**
 * Единственное место, где ошибка превращается в ответ. Клиент разбирает `code`,
 * не текст: тексты локализуются, коды — часть контракта.
 *
 * Наружу не уходит ничего, чего игроку знать не нужно: стек, SQL, имя констрейнта.
 */
@Catch()
export class DomainExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(DomainExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const reply = ctx.getResponse<FastifyReply>();
    const request = ctx.getRequest<FastifyRequest>();
    const traceId = request.id;

    if (exception instanceof DomainError) {
      const body: ApiErrorBody = {
        code: exception.code,
        message: exception.message,
        details: exception.details,
        traceId,
      };
      void reply.status(exception.status).send(body);
      return;
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body: ApiErrorBody = {
        code:
          status === 401
            ? ERROR_CODES.UNAUTHORIZED
            : status === 404
              ? ERROR_CODES.NOT_FOUND
              : ERROR_CODES.VALIDATION_FAILED,
        message: exception.message,
        details: exception.getResponse(),
        traceId,
      };
      void reply.status(status).send(body);
      return;
    }

    this.logger.error({ err: exception, traceId }, 'Необработанная ошибка');
    const body: ApiErrorBody = {
      code: ERROR_CODES.INTERNAL_ERROR,
      message: 'Что-то сломалось на нашей стороне. Мы уже знаем.',
      traceId,
    };
    void reply.status(500).send(body);
  }
}

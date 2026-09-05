import 'reflect-metadata';

import fastifyCookie from '@fastify/cookie';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module.js';
import { loadEnv } from './config/env.schema.js';

/**
 * Fastify, не Express: заметно выше throughput, а на автобете в Limbo и Plinko
 * это упирается быстро.
 */
async function bootstrap(): Promise<void> {
  const env = loadEnv();

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      // Идентификатор запроса протягивается в логи и в тело ошибки: при разборе
      // инцидента игрок называет его, и запрос находится за секунду.
      genReqId: () => crypto.randomUUID(),
      trustProxy: true,
      bodyLimit: 256 * 1024,
    }),
    { bufferLogs: true },
  );

  app.useLogger(app.get(Logger));
  await app.register(fastifyCookie, { secret: env.SESSION_SECRET });

  app.setGlobalPrefix('api');
  app.enableCors({ origin: env.CORS_ORIGIN.split(','), credentials: true });
  // Глобального ValidationPipe здесь нет намеренно: вся валидация идёт
  // zod-схемами из @kobold/contracts — теми же, из которых фронт выводит типы.
  // Вторая система валидации означала бы две правды о том, что считается
  // корректной ставкой, и class-validator в зависимостях без нужды.
  app.enableShutdownHooks();

  await app.listen({ port: env.API_PORT, host: env.API_HOST });
}

void bootstrap();

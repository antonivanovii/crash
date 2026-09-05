import 'reflect-metadata';

import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module.js';
import { loadEnv } from './config/env.schema.js';

/**
 * Слушает только localhost: наружу приложение выставляется через отдельный
 * ingress с собственной аутентификацией и сетевой изоляцией, а не флагом
 * в коде.
 */
async function bootstrap(): Promise<void> {
  const env = loadEnv();
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter(), {
    bufferLogs: true,
  });

  app.useLogger(app.get(Logger));
  app.setGlobalPrefix('admin');
  app.enableShutdownHooks();

  await app.listen({ port: env.ADMIN_API_PORT, host: '127.0.0.1' });
}

void bootstrap();

import 'reflect-metadata';

import { NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module.js';

/**
 * HTTP здесь нет: оркестратор ничего не обслуживает, он двигает раунды.
 * Отсюда createApplicationContext, а не create.
 */
async function bootstrap(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));
  app.enableShutdownHooks();

  app.get(Logger).log('Оркестратор поднят, участвует в выборах лидера');
}

void bootstrap();

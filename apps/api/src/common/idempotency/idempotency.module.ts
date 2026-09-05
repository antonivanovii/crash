import { Global, Module } from '@nestjs/common';
import { IdempotencyStore } from './idempotency.store.js';

@Global()
@Module({ providers: [IdempotencyStore], exports: [IdempotencyStore] })
export class IdempotencyModule {}

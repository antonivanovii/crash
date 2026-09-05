import { ERROR_CODES } from '@kobold/contracts';
import { Injectable, type ArgumentMetadata, type PipeTransform } from '@nestjs/common';
import type { ZodType } from 'zod';
import { DomainError } from '../errors/domain.error.js';

/**
 * Валидация границы теми же схемами, что использует фронт.
 *
 * Проверяется всё и всегда, независимо от того, «наш» ли клиент: белый список
 * позиций, перечисления конфигураций игр, диапазоны и уникальность чисел,
 * положительность и целочисленность сумм.
 */
@Injectable()
export class ZodValidationPipe<T> implements PipeTransform<unknown, T> {
  constructor(private readonly schema: ZodType<T>) {}

  transform(value: unknown, _metadata: ArgumentMetadata): T {
    const parsed = this.schema.safeParse(value);
    if (parsed.success) return parsed.data;

    throw new DomainError(
      ERROR_CODES.VALIDATION_FAILED,
      'Запрос не прошёл проверку.',
      400,
      parsed.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
    );
  }
}

/** Сахар: `@Body(zodBody(schema))`. */
export function zodBody<T>(schema: ZodType<T>): ZodValidationPipe<T> {
  return new ZodValidationPipe(schema);
}

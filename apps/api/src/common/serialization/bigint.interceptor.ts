import {
  Injectable,
  type CallHandler,
  type ExecutionContext,
  type NestInterceptor,
} from '@nestjs/common';
import { map, type Observable } from 'rxjs';

/**
 * Деньги на проводе — всегда строка целого числа минорных единиц.
 *
 * JSON не умеет bigint, а number теряет точность на больших суммах:
 * 9007199254740993 уезжает как 9007199254740992, и заметно это становится
 * поздно. Конвертация вынесена сюда, а не размазана по контроллерам, ровно
 * поэтому: контроллер, который забыл вызвать .toString(), уронил бы запрос
 * в рантайме — либо, что хуже, отдал бы число.
 */
@Injectable()
export class BigIntSerializerInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(map((body) => serialize(body)));
  }
}

function serialize(value: unknown): unknown {
  if (typeof value === 'bigint') return value.toString();
  if (value === null || typeof value !== 'object') return value;
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(serialize);

  const out: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value)) out[key] = serialize(item);
  return out;
}

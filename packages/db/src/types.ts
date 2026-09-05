import type { ColumnType, Generated as KyselyGenerated } from 'kysely';

export type Generated<T> = KyselyGenerated<T>;

/**
 * timestamptz. На чтении всегда Date, на записи можно Date или ISO-строку,
 * на вставке можно опустить — значение проставит DEFAULT now().
 *
 * Обернуть это в Generated<> нельзя: Generated не разворачивает вложенный
 * ColumnType, и на чтении вместо Date приезжает служебный тип.
 */
export type Timestamp = ColumnType<Date, Date | string | undefined, Date | string>;

export type TimestampNullable = ColumnType<
  Date | null,
  Date | string | null | undefined,
  Date | string | null
>;

/**
 * NUMERIC(38,0) — деньги в минорных единицах.
 *
 * Читается как bigint (парсер зарегистрирован в client.ts), пишется как bigint
 * или строка. number сюда не пролезает намеренно: это ровно тот путь, которым
 * теряется точность.
 */
export type Money = ColumnType<bigint, bigint | string, bigint | string>;

export type MoneyNullable = ColumnType<
  bigint | null,
  bigint | string | null | undefined,
  bigint | string | null
>;

/** jsonb: читается как T, пишется как T. */
export type Json<T> = ColumnType<T, T, T>;

export type JsonNullable<T> = ColumnType<T | null, T | null | undefined, T | null>;

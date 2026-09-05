/**
 * NUMERIC(38,0) ↔ bigint.
 *
 * Драйвер pg по умолчанию отдаёт NUMERIC строкой — и это правильно. Здесь
 * единственное разрешённое место преобразования, чтобы «тихое» превращение
 * в number не случилось где-нибудь в репозитории.
 */
export function numericToBigInt(value: string | number | bigint | null): bigint {
  if (value === null) throw new TypeError('NUMERIC пришёл null там, где ожидалась сумма');
  if (typeof value === 'bigint') return value;
  if (typeof value === 'number') {
    if (!Number.isSafeInteger(value)) {
      throw new TypeError(`NUMERIC пришёл как небезопасное число: ${value}`);
    }
    return BigInt(value);
  }
  const trimmed = value.trim();
  if (!/^-?\d+$/.test(trimmed)) {
    throw new TypeError(`NUMERIC ожидался целым в минорных единицах, пришло: «${value}»`);
  }
  return BigInt(trimmed);
}

export function numericToBigIntOrNull(value: string | number | bigint | null): bigint | null {
  return value === null ? null : numericToBigInt(value);
}

export function bigIntToNumeric(value: bigint): string {
  return value.toString();
}

/** Для JSON: bigint не сериализуется, поэтому наружу он всегда уходит строкой. */
export function serializeBigInts<T>(value: T): T {
  return JSON.parse(
    JSON.stringify(value, (_key, v: unknown) => (typeof v === 'bigint' ? v.toString() : v)),
  ) as T;
}

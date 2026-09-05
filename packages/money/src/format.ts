import { type CurrencyCode, currencyOf, scaleOf } from './currency.js';

/**
 * Разбор пользовательского ввода в минорные единицы.
 * Никакого parseFloat: строка разбирается посимвольно, лишние знаки — ошибка,
 * а не молчаливое округление.
 */
export function parseAmount(input: string, currency: CurrencyCode): bigint {
  const scale = scaleOf(currency);
  const trimmed = input.trim().replace(/\s|_/g, '').replace(',', '.');

  if (!/^-?\d*(\.\d*)?$/.test(trimmed) || trimmed === '' || trimmed === '-' || trimmed === '.') {
    throw new RangeError(`Не число: «${input}»`);
  }

  const negative = trimmed.startsWith('-');
  const unsigned = negative ? trimmed.slice(1) : trimmed;
  const [wholeRaw = '', fracRaw = ''] = unsigned.split('.');

  if (fracRaw.length > scale) {
    throw new RangeError(`${currency} допускает не больше ${scale} знаков после точки`);
  }

  const whole = wholeRaw === '' ? '0' : wholeRaw;
  const frac = fracRaw.padEnd(scale, '0');
  const value = BigInt(whole + frac);
  return negative ? -value : value;
}

/**
 * Разделитель разрядов — узкий неразрывный пробел (U+202F): сумма не должна
 * переноситься по строке посередине числа.
 */
export const GROUP_SEPARATOR = '\u202f';

/** Минорные единицы → строка без символа валюты: 1234n, USD → «12.34». */
export function formatAmount(
  amount: bigint,
  currency: CurrencyCode,
  options: { trimZeros?: boolean; group?: boolean } = {},
): string {
  const scale = scaleOf(currency);
  const negative = amount < 0n;
  const digits = (negative ? -amount : amount).toString().padStart(scale + 1, '0');

  let whole = scale === 0 ? digits : digits.slice(0, -scale);
  let frac = scale === 0 ? '' : digits.slice(-scale);

  if (options.trimZeros && frac) frac = frac.replace(/0+$/, '');
  if (options.group) whole = whole.replace(/\B(?=(\d{3})+(?!\d))/g, GROUP_SEPARATOR);

  const separator = currencyOf(currency).decimalSeparator ?? '.';
  const body = frac ? `${whole}${separator}${frac}` : whole;
  return `${negative ? '-' : ''}${body}`;
}

/** То же, но с символом валюты — для интерфейса. */
export function formatMoney(
  amount: bigint,
  currency: CurrencyCode,
  options: { trimZeros?: boolean; group?: boolean } = { group: true },
): string {
  const { symbol, symbolAfter } = currencyOf(currency);
  const value = formatAmount(amount, currency, options);

  // Узкий неразрывный пробел перед знаком: «1 284,50 ₽» не рвётся по строке.
  return symbolAfter ? `${value}${GROUP_SEPARATOR}${symbol}` : `${symbol}${value}`;
}

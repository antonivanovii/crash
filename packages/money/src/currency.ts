/**
 * Валюты и их масштаб. Баланс всегда хранится в минорных единицах:
 * USD 12.34 → 1234n при scale = 2.
 *
 * Масштаб — часть контракта БД (NUMERIC(38,0)), менять его задним числом нельзя:
 * все исторические строки в леджере записаны в старом масштабе.
 */
export const CURRENCIES = {
  RUB: { code: 'RUB', scale: 2, symbol: '₽', symbolAfter: true, decimalSeparator: ',' },
  USD: { code: 'USD', scale: 2, symbol: '$' },
  EUR: { code: 'EUR', scale: 2, symbol: '€' },
  BTC: { code: 'BTC', scale: 8, symbol: '₿' },
  ETH: { code: 'ETH', scale: 8, symbol: 'Ξ' },
  USDT: { code: 'USDT', scale: 6, symbol: '₮' },
} as const satisfies Record<string, CurrencyDef>;

export interface CurrencyDef {
  readonly code: string;
  readonly scale: number;
  readonly symbol: string;
  /**
   * Знак после суммы. Рубль пишется «1 284,50 ₽», доллар — «$1 284.50»:
   * позиция знака — часть валюты, а не настройка форматирования.
   */
  readonly symbolAfter?: boolean;
  /** Разделитель дробной части. У рубля запятая, у доллара точка. */
  readonly decimalSeparator?: ',' | '.';
}

export type CurrencyCode = keyof typeof CURRENCIES;

export const CURRENCY_CODES = Object.keys(CURRENCIES) as CurrencyCode[];

export function isCurrencyCode(value: string): value is CurrencyCode {
  return Object.prototype.hasOwnProperty.call(CURRENCIES, value);
}

export function currencyOf(code: CurrencyCode): CurrencyDef {
  return CURRENCIES[code];
}

export function scaleOf(code: CurrencyCode): number {
  return CURRENCIES[code].scale;
}

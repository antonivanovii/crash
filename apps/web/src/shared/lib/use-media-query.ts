import { useSyncExternalStore } from 'react';

/**
 * Брейкпоинты приложения.
 *
 * В макетах нарисованы только 1440 и 390 — промежуточные ширины спроектированы
 * нами. Правило простое: сайдбар раздела требует 232px и не должен съедать
 * больше четверти экрана, отсюда 1280. Ниже 900 колоночная раскладка перестаёт
 * работать вовсе, и включается мобильная с таббаром.
 */
export const BREAKPOINT = {
  /** ≥1280 — десктоп из макета: топбар, сайдбар, контент, опциональная правая колонка. */
  desktop: 1280,
  /** ≥900 — сайдбар уезжает в шторку, контент во всю ширину. */
  tablet: 900,
} as const;

const QUERIES = {
  desktop: `(min-width: ${BREAKPOINT.desktop}px)`,
  tablet: `(min-width: ${BREAKPOINT.tablet}px)`,
} as const;

/**
 * Подписка на media query без ре-рендера на каждый кадр ресайза: браузер сам
 * дёргает слушателя только при пересечении границы.
 */
const subscribers = new Map<string, (onChange: () => void) => () => void>();

function subscriberFor(query: string) {
  let subscribe = subscribers.get(query);
  if (!subscribe) {
    subscribe = (onChange: () => void) => {
      const list = window.matchMedia(query);
      list.addEventListener('change', onChange);
      return () => list.removeEventListener('change', onChange);
    };
    subscribers.set(query, subscribe);
  }
  return subscribe;
}

export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    // Подписка мемоизирована по запросу: новая функция на каждый рендер
    // заставляла бы React переподписываться после каждой отрисовки.
    subscriberFor(query),
    () => window.matchMedia(query).matches,
    // На сервере медиазапросов нет; SSR тут не используется, но хук обязан быть честным.
    () => false,
  );
}

/** Десктопная раскладка: сайдбар стоит рядом с контентом. */
export function useIsDesktop(): boolean {
  return useMediaQuery(QUERIES.desktop);
}

/**
 * Мобильная раскладка: топбар 52px, таббар снизу, детали открываются шторками.
 * Между `tablet` и `desktop` раскладка ещё десктопная, но сайдбар в шторке.
 */
export function useIsMobile(): boolean {
  return !useMediaQuery(QUERIES.tablet);
}

/**
 * Лимиты игрока.
 *
 * Правило, ради которого всё это существует: ужесточение применяется сразу,
 * ослабление — через 24 часа. В макете оно описано текстом, но не нарисовано,
 * поэтому состояние «заявка на ослабление» спроектировано здесь.
 *
 * Таблица `user_limits` с колонкой `effective_at` для этого уже готова:
 * отложенная заявка — это просто строка с датой в будущем.
 */
export interface LimitState {
  /** Действующее значение в минорных единицах. */
  readonly value: bigint;
  /**
   * Запрошенное ослабление и момент, с которого оно вступит в силу.
   * Ужесточение сюда не попадает — оно применяется мгновенно.
   */
  readonly pending?: { value: bigint; effectiveAt: Date };
}

export const DEFERRAL_HOURS = 24;

/** Ослабление — это увеличение потолка. Всё остальное действует немедленно. */
export function isRelaxation(current: bigint, next: bigint): boolean {
  return next > current;
}

/**
 * Заявка на смену лимита. Возвращает новое состояние: либо значение
 * применено, либо поставлено в очередь с датой.
 */
export function requestLimitChange(state: LimitState, next: bigint, now = new Date()): LimitState {
  if (!isRelaxation(state.value, next)) {
    // Ужесточение отменяет и висящее ослабление: игрок передумал.
    return { value: next };
  }

  const effectiveAt = new Date(now.getTime() + DEFERRAL_HOURS * 60 * 60 * 1000);
  return { ...state, pending: { value: next, effectiveAt } };
}

export function cancelPending(state: LimitState): LimitState {
  return { value: state.value };
}

/** «26.08 в 13:41» — без года: заявка живёт сутки. */
export function formatEffectiveAt(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${day}.${month} в ${hours}:${minutes}`;
}

import type { GameSlug } from '@kobold/game-engine';

/**
 * Контракт сокета.
 *
 * Правила, которые видны прямо в типах:
 *  — баланс приходит ТОЛЬКО отсюда, единственным источником истины;
 *  — множитель crash не транслируется: клиент считает его из startedAt сам,
 *    сервер шлёт старт, батчи кэшаутов и крах;
 *  — после реконнекта клиент запрашивает полный снапшот, а не «продолжение».
 */

export interface ServerTime {
  /** Серверное время в миллисекундах. Клиент оценивает смещение часов по round-trip. */
  readonly serverTime: number;
}

export type SharedRoundPhase = 'BETTING' | 'RUNNING' | 'SETTLING' | 'IDLE';

export interface BalanceUpdate {
  readonly currency: string;
  readonly available: string;
  readonly locked: string;
  /** Монотонная версия: сообщение из прошлого не должно откатывать баланс. */
  readonly version: number;
}

export interface SharedRoundStarted extends ServerTime {
  readonly game: GameSlug;
  readonly roundId: string;
  readonly phase: SharedRoundPhase;
  readonly startedAt: number;
  /** Когда закрывается приём ставок. Для фазы BETTING. */
  readonly closesAt: number | null;
  /** Хэш сида раунда: коммитмент публикуется до розыгрыша. */
  readonly seedHash: string;
}

export interface SharedRoundCashout {
  readonly userId: string;
  readonly displayName: string;
  readonly stake: string;
  readonly multiplier: string;
  readonly payout: string;
}

/** Кэшауты приходят пачками: окно батчинга 100 мс. Разворачивать в отдельные сообщения нельзя. */
export interface SharedRoundCashoutBatch {
  readonly game: GameSlug;
  readonly roundId: string;
  readonly cashouts: readonly SharedRoundCashout[];
}

export interface SharedRoundEnded extends ServerTime {
  readonly game: GameSlug;
  readonly roundId: string;
  readonly outcome: Record<string, unknown>;
  /** Раскрывается вместе с результатом — звено цепочки для проверки. */
  readonly seed: string;
  readonly chainIndex: number;
}

export interface OpenRoundState {
  readonly game: GameSlug;
  readonly roundId: string;
  readonly step: number;
  readonly stake: string;
  readonly currentMultiplier: string;
  readonly revealed: Record<string, unknown>;
}

/** Полный снапшот: то, что клиент запрашивает после каждого восстановления связи. */
export interface Snapshot extends ServerTime {
  readonly balances: readonly BalanceUpdate[];
  /** Брошенные открытые раунды — из них строится секция «продолжить» и модалка восстановления. */
  readonly openRounds: readonly OpenRoundState[];
  readonly sharedRounds: readonly SharedRoundStarted[];
}

export interface ConnectionNotice {
  readonly kind: 'MAINTENANCE' | 'FEED_SILENT' | 'KILL_SWITCH';
  readonly message: string;
  readonly until: number | null;
}

/** События сервер → клиент. */
export interface ServerEvents {
  snapshot: (payload: Snapshot) => void;
  balance: (payload: BalanceUpdate) => void;
  'round:started': (payload: SharedRoundStarted) => void;
  'round:cashouts': (payload: SharedRoundCashoutBatch) => void;
  'round:ended': (payload: SharedRoundEnded) => void;
  'open-round': (payload: OpenRoundState) => void;
  notice: (payload: ConnectionNotice) => void;
}

/** События клиент → сервер. Ставок здесь нет: деньги ходят только по HTTP с ключом идемпотентности. */
export interface ClientEvents {
  subscribe: (payload: { rooms: readonly string[] }) => void;
  unsubscribe: (payload: { rooms: readonly string[] }) => void;
  'snapshot:request': (payload: Record<string, never>) => void;
  /** Пинг для оценки смещения часов; сервер отвечает своим временем. */
  'time:sync': (payload: { clientTime: number }, ack: (r: ServerTime) => void) => void;
}

export type ServerEventName = keyof ServerEvents;
export type ClientEventName = keyof ClientEvents;

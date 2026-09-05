import type {
  BalanceUpdate,
  ConnectionNotice,
  OpenRoundState,
  SharedRoundCashoutBatch,
  SharedRoundEnded,
  SharedRoundStarted,
  Snapshot,
} from '@kobold/contracts';
import { io, type Socket } from 'socket.io-client';
import { useConnectionStore } from '../model/connection.store.js';

/**
 * Транспорт реального времени. Одно соединение на всё приложение.
 *
 * Слой shared умышленно ничего не знает о сущностях: клиент только доставляет
 * типизированные события и держит состояние связи. Раскладывает события по
 * сторам провайдер в слое app — иначе транспорт пришлось бы тащить наверх
 * по зависимостям.
 *
 * Что здесь обязано быть:
 *  — реконнект с экспоненциальной задержкой и запросом ПОЛНОГО снапшота после
 *    восстановления, а не «продолжения с того места»;
 *  — оценка смещения часов по round-trip;
 *  — подписка по комнатам, привязанная к монтированию экрана;
 *  — батчинг входящих.
 */
export interface RealtimeEvents {
  snapshot: Snapshot;
  balance: BalanceUpdate;
  'round:started': SharedRoundStarted;
  'round:cashouts': SharedRoundCashoutBatch;
  'round:ended': SharedRoundEnded;
  'open-round': OpenRoundState;
  notice: ConnectionNotice;
}

type Handler<K extends keyof RealtimeEvents> = (payload: RealtimeEvents[K]) => void;

const CLOCK_SAMPLES = 5;
const CASHOUT_BATCH_WINDOW_MS = 100;

export class RealtimeClient {
  private socket: Socket | null = null;
  private readonly rooms = new Map<string, number>();
  private readonly handlers = new Map<keyof RealtimeEvents, Set<Handler<never>>>();

  /** Кэшауты приходят пачками; окно 100 мс не даёт им превратиться в поток ре-рендеров. */
  private cashoutBuffer: SharedRoundCashoutBatch[] = [];
  private flushTimer: ReturnType<typeof setTimeout> | null = null;

  on<K extends keyof RealtimeEvents>(event: K, handler: Handler<K>): () => void {
    const set = this.handlers.get(event) ?? new Set();
    set.add(handler as Handler<never>);
    this.handlers.set(event, set);
    return () => set.delete(handler as Handler<never>);
  }

  private emit<K extends keyof RealtimeEvents>(event: K, payload: RealtimeEvents[K]): void {
    for (const handler of this.handlers.get(event) ?? []) {
      (handler as Handler<K>)(payload);
    }
  }

  connect(token: string): void {
    if (this.socket) return;

    const connection = useConnectionStore.getState();
    const socket = io(import.meta.env.VITE_WS_URL ?? window.location.origin, {
      auth: { token },
      transports: ['websocket'],
      // Экспоненциальная задержка: сервер, который лёг под нагрузкой, не должен
      // получить от каждого клиента по запросу в секунду.
      reconnection: true,
      reconnectionDelay: 500,
      reconnectionDelayMax: 10_000,
      randomizationFactor: 0.5,
    });

    socket.on('connect', () => {
      connection.setConnection('online');
      void this.syncClock();
      // Полный снапшот и переподписка на комнаты: пропущенное за время обрыва
      // по событиям не восстанавливается.
      socket.emit('snapshot:request', {});
      const rooms = [...this.rooms.keys()];
      if (rooms.length > 0) socket.emit('subscribe', { rooms });
    });

    socket.on('disconnect', () => connection.setConnection('offline'));
    socket.io.on('reconnect_attempt', () => connection.setConnection('connecting'));

    socket.on('snapshot', (payload: Snapshot) => {
      connection.setClockOffset(payload.serverTime - Date.now());
      this.emit('snapshot', payload);
    });
    socket.on('balance', (payload: BalanceUpdate) => this.emit('balance', payload));
    socket.on('round:started', (payload: SharedRoundStarted) =>
      this.emit('round:started', payload),
    );
    socket.on('open-round', (payload: OpenRoundState) => this.emit('open-round', payload));
    socket.on('notice', (payload: ConnectionNotice) => connection.setNotice(payload));

    socket.on('round:cashouts', (payload: SharedRoundCashoutBatch) => this.bufferCashouts(payload));
    socket.on('round:ended', (payload: SharedRoundEnded) => {
      this.flushCashouts();
      this.emit('round:ended', payload);
    });

    this.socket = socket;
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
    this.rooms.clear();
  }

  /**
   * Подписка со счётчиком ссылок: лобби и экран игры могут держать одну комнату
   * одновременно, и уход с экрана не должен ронять подписку лобби.
   */
  join(room: string): () => void {
    const count = this.rooms.get(room) ?? 0;
    this.rooms.set(room, count + 1);
    if (count === 0) this.socket?.emit('subscribe', { rooms: [room] });

    return () => {
      const current = this.rooms.get(room) ?? 0;
      if (current <= 1) {
        this.rooms.delete(room);
        this.socket?.emit('unsubscribe', { rooms: [room] });
      } else {
        this.rooms.set(room, current - 1);
      }
    };
  }

  /**
   * Упрощённый NTP: несколько замеров round-trip, берётся медиана.
   * Небольшой дрейф визуально незаметен, а авторитетным остаётся событие краха.
   */
  private async syncClock(): Promise<void> {
    const socket = this.socket;
    if (!socket) return;

    const offsets: number[] = [];
    for (let i = 0; i < CLOCK_SAMPLES; i += 1) {
      const sentAt = Date.now();
      const reply = await new Promise<{ serverTime: number } | null>((resolve) => {
        const timeout = setTimeout(() => resolve(null), 2000);
        socket.emit('time:sync', { clientTime: sentAt }, (r: { serverTime: number }) => {
          clearTimeout(timeout);
          resolve(r);
        });
      });
      if (!reply) continue;

      const receivedAt = Date.now();
      offsets.push(reply.serverTime + (receivedAt - sentAt) / 2 - receivedAt);
    }

    if (offsets.length === 0) return;
    offsets.sort((a, b) => a - b);
    useConnectionStore.getState().setClockOffset(offsets[Math.floor(offsets.length / 2)] ?? 0);
  }

  private bufferCashouts(batch: SharedRoundCashoutBatch): void {
    this.cashoutBuffer.push(batch);
    this.flushTimer ??= setTimeout(() => this.flushCashouts(), CASHOUT_BATCH_WINDOW_MS);
  }

  private flushCashouts(): void {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }
    const first = this.cashoutBuffer[0];
    if (!first) return;

    const merged: SharedRoundCashoutBatch = {
      game: first.game,
      roundId: first.roundId,
      cashouts: this.cashoutBuffer.flatMap((b) => b.cashouts),
    };
    this.cashoutBuffer = [];
    this.emit('round:cashouts', merged);
  }
}

export const realtimeClient = new RealtimeClient();

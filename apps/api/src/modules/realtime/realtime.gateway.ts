import { ROOMS, type Snapshot } from '@kobold/contracts';
import { Logger } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  type OnGatewayConnection,
  type OnGatewayDisconnect,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';
import { AuthService } from '../auth/auth.service.js';
import { WalletService } from '../wallet/wallet.service.js';

/**
 * Гейтвей stateless и без логики раунда.
 *
 * Он умеет ровно четыре вещи: аутентифицировать сокет, подписать на комнату,
 * отдать снапшот, транслировать. Раунды двигает оркестратор, события приходят
 * сюда через Redis pub/sub.
 *
 *   orchestrator → Redis pub/sub → gateway (N инстансов) → клиенты
 */
@WebSocketGateway({ cors: { origin: true, credentials: true } })
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(RealtimeGateway.name);

  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly auth: AuthService,
    private readonly wallets: WalletService,
  ) {}

  async handleConnection(socket: Socket): Promise<void> {
    const token =
      typeof socket.handshake.auth?.token === 'string' ? socket.handshake.auth.token : null;
    const user = token ? await this.auth.validate(token) : null;

    if (!user) {
      socket.disconnect(true);
      return;
    }

    socket.data.userId = user.id;
    await socket.join(ROOMS.user(user.id));
    // Снапшот отдаётся сразу: клиенту не нужно спрашивать, что происходит.
    socket.emit('snapshot', await this.snapshot(user.id));
  }

  handleDisconnect(socket: Socket): void {
    this.logger.debug({ socketId: socket.id }, 'Сокет отключился');
  }

  /**
   * Подписка по комнатам. Зашёл в crash — подписался, вышел — отписался.
   * Без этого клиент получает события всех игр сразу.
   */
  @SubscribeMessage('subscribe')
  async subscribe(
    @ConnectedSocket() socket: Socket,
    @MessageBody() body: { rooms: string[] },
  ): Promise<void> {
    await socket.join(body.rooms.filter((r) => isPublicRoom(r)));
  }

  @SubscribeMessage('unsubscribe')
  async unsubscribe(
    @ConnectedSocket() socket: Socket,
    @MessageBody() body: { rooms: string[] },
  ): Promise<void> {
    await Promise.all(body.rooms.map((room) => socket.leave(room)));
  }

  /**
   * Полный снапшот после реконнекта — не «продолжить с того места».
   * Клиент, пропустивший события, должен получить состояние целиком.
   */
  @SubscribeMessage('snapshot:request')
  async snapshotRequest(@ConnectedSocket() socket: Socket): Promise<Snapshot> {
    return this.snapshot(socket.data.userId as string);
  }

  /**
   * Оценка смещения часов по round-trip. Нужна для crash и таймеров фаз:
   * множитель клиент считает сам от startedAt, и расхождение часов видно сразу.
   */
  @SubscribeMessage('time:sync')
  timeSync(): { serverTime: number } {
    return { serverTime: Date.now() };
  }

  private async snapshot(userId: string): Promise<Snapshot> {
    const balances = await this.wallets.balances(userId);
    return {
      serverTime: Date.now(),
      balances: balances.map((b) => ({
        currency: b.currency,
        available: b.balance.toString(),
        locked: b.locked.toString(),
        version: 0,
      })),
      openRounds: [],
      sharedRounds: [],
    };
  }
}

/** Подписаться можно только на публичные комнаты: личная выдаётся при подключении. */
function isPublicRoom(room: string): boolean {
  return (
    room === ROOMS.lobby() ||
    room.startsWith('game:') ||
    room.startsWith('sports:') ||
    room.startsWith('market:')
  );
}

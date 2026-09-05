import { toJsonb } from '@kobold/db';
import type { BetOutcome, GameSlug } from '@kobold/game-engine';
import { applyMultiplier, type Multiplier } from '@kobold/money';
import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../../database/database.service.js';
import { SeedService } from '../../fairness/seed.service.js';
import { LedgerService } from '../../ledger/ledger.service.js';
import { RiskService } from '../../risk/risk.service.js';
import { WalletService } from '../../wallet/wallet.service.js';

export interface PlaceAtomicBetInput<TParams, TResult> {
  readonly userId: string;
  readonly game: GameSlug;
  readonly currency: string;
  readonly stake: bigint;
  readonly idempotencyKey: string;
  readonly params: TParams;
  /**
   * Максимально возможный множитель по этой ставке — для проверки потолка
   * прибыли ДО приёма. Для Limbo это таргет, для Dice — множитель порога.
   */
  readonly maxMultiplier: Multiplier;
  /** Чистая функция из game-engine. Никакого доступа к БД, никаких побочных эффектов. */
  readonly play: (seed: {
    serverSeed: string;
    clientSeed: string;
    nonce: number;
  }) => BetOutcome<TResult>;
}

export interface PlacedBet<TResult> {
  readonly id: string;
  readonly game: GameSlug;
  readonly stake: bigint;
  readonly payout: bigint;
  readonly multiplier: Multiplier;
  readonly won: boolean;
  readonly currency: string;
  readonly nonce: number;
  readonly serverSeedHash: string;
  readonly clientSeed: string;
  readonly result: TResult;
  readonly balanceAfter: bigint;
  readonly createdAt: Date;
}

/**
 * Каноническая форма денежной операции. Все атомарные игры проходят ровно здесь;
 * `games/*` содержат только оркестрацию, вся математика — в game-engine.
 *
 * Порядок шагов не декоративный:
 *   1. идемпотентность — ретрай возвращает ту же ставку, а не делает новую;
 *   2. блокировка кошелька — до всех проверок, чтобы между проверкой и списанием
 *      не влезла вторая ставка;
 *   3. лимиты — внутри той же транзакции, иначе обходятся параллелизмом;
 *   4. чистая функция — те же входы дают тот же выход всегда;
 *   5. двойная запись;
 *   6. запись ВХОДОВ вместе с результатом — иначе раунд не воспроизвести.
 *
 * И отдельно: результат вычисляется внутри транзакции, но раскрывается только
 * после коммита. Показать игроку ролл и откатить транзакцию — значит
 * переиспользовать nonce и получить на нём другой результат. Верификация после
 * такого разваливается, и объяснить это будет нечем.
 */
@Injectable()
export class BetService {
  constructor(
    private readonly database: DatabaseService,
    private readonly wallets: WalletService,
    private readonly seeds: SeedService,
    private readonly ledger: LedgerService,
    private readonly risk: RiskService,
  ) {}

  async placeAtomicBet<TParams, TResult>(
    input: PlaceAtomicBetInput<TParams, TResult>,
  ): Promise<PlacedBet<TResult>> {
    return this.database.transaction(async (tx) => {
      // 1. Идемпотентность на уровне денег: тот же ключ — та же ставка.
      const existing = await tx
        .selectFrom('bets')
        .selectAll()
        .where('idempotency_key', '=', input.idempotencyKey)
        .executeTakeFirst();

      if (existing) {
        const wallet = await tx
          .selectFrom('wallets')
          .select('balance')
          .where('user_id', '=', input.userId)
          .where('currency', '=', existing.currency)
          .executeTakeFirstOrThrow();

        return {
          id: existing.id,
          game: existing.game as GameSlug,
          stake: existing.stake,
          payout: existing.payout,
          multiplier: existing.multiplier,
          won: existing.won,
          currency: existing.currency,
          nonce: existing.nonce ?? 0,
          serverSeedHash: '',
          clientSeed: '',
          result: existing.result as TResult,
          balanceAfter: wallet.balance,
          createdAt: existing.created_at,
        };
      }

      // 2. Блокировка кошелька. Всегда первая в порядке блокировок.
      await this.wallets.lockAndCheck(tx, input.userId, input.currency, input.stake);

      // 3. Лимиты и самоисключение.
      await this.risk.assertNotSelfExcluded(tx, input.userId);
      this.risk.checkStake({
        currency: input.currency,
        stake: input.stake,
        maxMultiplier: input.maxMultiplier,
      });
      await this.risk.checkUserLimits(tx, input.userId, 'STAKE', input.stake);

      // 4. Атомарный nonce и чистая функция.
      const seed = await this.seeds.nextNonce(tx, input.userId);
      const outcome = input.play({
        serverSeed: seed.server_seed,
        clientSeed: seed.client_seed,
        nonce: seed.nonce,
      });
      const payout = applyMultiplier(input.stake, outcome.multiplier);

      // 5. Двойная запись. Ставка уходит дому, выплата приходит от дома.
      const posted = await this.ledger.post(tx, {
        kind: 'BET',
        idempotencyKey: input.idempotencyKey,
        userId: input.userId,
        legs: [
          {
            account: { kind: 'USER_WALLET', userId: input.userId, currency: input.currency },
            amount: -input.stake,
            type: 'BET',
          },
          {
            account: { kind: 'HOUSE', currency: input.currency },
            amount: input.stake,
            type: 'BET',
          },
          ...(payout > 0n
            ? ([
                {
                  account: { kind: 'HOUSE', currency: input.currency },
                  amount: -payout,
                  type: 'PAYOUT',
                },
                {
                  account: { kind: 'USER_WALLET', userId: input.userId, currency: input.currency },
                  amount: payout,
                  type: 'PAYOUT',
                },
              ] as const)
            : []),
        ],
      });

      // 6. Входы и результат вместе: через год строку прогоняют через ту же
      //    функцию и получают байт-в-байт тот же исход.
      const bet = await tx
        .insertInto('bets')
        .values({
          idempotency_key: input.idempotencyKey,
          user_id: input.userId,
          game: input.game,
          currency: input.currency,
          seed_pair_id: seed.id,
          nonce: seed.nonce,
          stake: input.stake,
          payout,
          multiplier: outcome.multiplier,
          won: outcome.won,
          // bigint внутри jsonb роняет драйвер — см. toJsonb.
          params: toJsonb(input.params) as Record<string, unknown>,
          result: toJsonb(outcome.result) as Record<string, unknown>,
          tx_id: posted.id,
        })
        .returning(['id', 'created_at'])
        .executeTakeFirstOrThrow();

      return {
        id: bet.id,
        game: input.game,
        stake: input.stake,
        payout,
        multiplier: outcome.multiplier,
        won: outcome.won,
        currency: input.currency,
        nonce: seed.nonce,
        serverSeedHash: seed.server_seed_hash,
        clientSeed: seed.client_seed,
        result: outcome.result,
        balanceAfter: posted.balances.get(input.currency) ?? 0n,
        createdAt: bet.created_at,
      };
    });
  }

  async history(userId: string, limit: number, game?: GameSlug, cursor?: string) {
    let query = this.database.db
      .selectFrom('bets')
      .selectAll()
      .where('user_id', '=', userId)
      .orderBy('created_at', 'desc')
      .orderBy('id', 'desc')
      .limit(limit + 1);

    if (game) query = query.where('game', '=', game);
    if (cursor) query = query.where('id', '<', cursor);

    const rows = await query.execute();
    const items = rows.slice(0, limit);
    return { items, nextCursor: rows.length > limit ? (items.at(-1)?.id ?? null) : null };
  }
}

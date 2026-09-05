import { lockWallet, type Tx } from '@kobold/db';
import { Injectable } from '@nestjs/common';
import { InsufficientFunds } from '../../common/errors/domain.error.js';
import { DatabaseService } from '../../database/database.service.js';

/**
 * Кошелёк. Денормализованный баланс поверх леджера: источник истины — сумма
 * проводок, а эта таблица нужна ради FOR UPDATE и быстрого чтения.
 *
 * Ночная сверка обязана сводить одно с другим; расхождение — инцидент, а не
 * повод пересчитать кошелёк «по факту».
 */
@Injectable()
export class WalletService {
  constructor(private readonly database: DatabaseService) {}

  async ensureWallet(tx: Tx, userId: string, currency: string): Promise<string> {
    const existing = await tx
      .selectFrom('wallets')
      .select('id')
      .where('user_id', '=', userId)
      .where('currency', '=', currency)
      .executeTakeFirst();
    if (existing) return existing.id;

    const account = await tx
      .insertInto('accounts')
      .values({ owner_type: 'USER', owner_id: userId, kind: 'USER_WALLET', currency })
      .returning('id')
      .executeTakeFirstOrThrow();

    const wallet = await tx
      .insertInto('wallets')
      .values({ user_id: userId, account_id: account.id, currency, balance: 0n, locked: 0n })
      .returning('id')
      .executeTakeFirstOrThrow();

    return wallet.id;
  }

  /**
   * Блокирует кошелёк и проверяет, что средств хватает.
   *
   * Проверка ПОСЛЕ блокировки — единственный корректный порядок: между чтением
   * баланса и списанием не должно быть окна, в которое влезет вторая ставка.
   */
  async lockAndCheck(tx: Tx, userId: string, currency: string, required: bigint) {
    const wallet = await lockWallet(tx, userId, currency);
    if (wallet.balance < required) throw new InsufficientFunds(required - wallet.balance);
    return wallet;
  }

  async balances(userId: string) {
    return this.database.db
      .selectFrom('wallets')
      .select(['currency', 'balance', 'locked'])
      .where('user_id', '=', userId)
      .orderBy('currency')
      .execute();
  }

  async statement(userId: string, limit: number, cursor?: string) {
    let query = this.database.db
      .selectFrom('entries')
      .innerJoin('accounts', 'accounts.id', 'entries.account_id')
      .innerJoin('transactions', 'transactions.id', 'entries.tx_id')
      .select([
        'entries.id',
        'entries.tx_id',
        'entries.type',
        'entries.amount',
        'entries.balance_after',
        'entries.created_at',
        'accounts.currency',
      ])
      .where('accounts.owner_id', '=', userId)
      .where('accounts.kind', '=', 'USER_WALLET')
      .orderBy('entries.created_at', 'desc')
      .orderBy('entries.id', 'desc')
      .limit(limit + 1);

    if (cursor) query = query.where('entries.id', '<', cursor);

    const rows = await query.execute();
    const items = rows.slice(0, limit);
    return { items, nextCursor: rows.length > limit ? (items.at(-1)?.id ?? null) : null };
  }
}

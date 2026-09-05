import type { EntryType, TransactionKind, Tx } from '@kobold/db';
import { sum } from '@kobold/money';
import { Injectable } from '@nestjs/common';

/**
 * Ядро денег: двойная запись.
 *
 * Ни один рубль не появляется и не исчезает — он переезжает между счетами.
 * Сумма проводок в транзакции равна нулю, и это проверяет отложенный триггер
 * в БД, а не аккуратность автора сервиса.
 */

/** Куда именно едут деньги. Системные счета — по одному на вид и валюту. */
export type AccountRef =
  | { kind: 'USER_WALLET'; userId: string; currency: string }
  | { kind: 'HOUSE' | 'FEE' | 'ESCROW' | 'SUBSIDY'; currency: string };

export interface Leg {
  readonly account: AccountRef;
  readonly amount: bigint;
  readonly type: EntryType;
}

export interface PostParams {
  readonly kind: TransactionKind;
  readonly idempotencyKey: string;
  readonly userId: string | null;
  readonly legs: readonly Leg[];
}

export interface PostedTransaction {
  readonly id: string;
  /** Балансы кошельков после проводок — то, что уходит в ответ и в сокет. */
  readonly balances: ReadonlyMap<string, bigint>;
}

@Injectable()
export class LedgerService {
  /**
   * Проводит транзакцию. Вызывается ТОЛЬКО внутри уже открытой транзакции БД,
   * и только после того, как кошельки заблокированы через FOR UPDATE.
   *
   * Порядок блокировок во всём проекте одинаков: сначала кошелёк, потом раунд
   * или исход. Разный порядок в разных местах даёт дедлоки, которые
   * воспроизводятся раз в неделю.
   */
  async post(tx: Tx, params: PostParams): Promise<PostedTransaction> {
    if (params.legs.length === 0) throw new Error('Транзакция без проводок');

    const total = sum(params.legs.map((l) => l.amount));
    if (total !== 0n) {
      // Триггер в БД поймал бы это на коммите, но сообщение было бы хуже.
      throw new Error(`Проводки не сходятся в ноль: остаток ${total}`);
    }

    const transaction = await tx
      .insertInto('transactions')
      .values({
        kind: params.kind,
        idempotency_key: params.idempotencyKey,
        user_id: params.userId,
      })
      .returning('id')
      .executeTakeFirstOrThrow();

    const balances = new Map<string, bigint>();

    for (const leg of params.legs) {
      const accountId = await this.resolveAccount(tx, leg.account);
      let balanceAfter: bigint | null = null;

      if (leg.account.kind === 'USER_WALLET') {
        // Кошелёк уже под FOR UPDATE — инкремент безопасен.
        const wallet = await tx
          .updateTable('wallets')
          .set((eb) => ({
            balance: eb('balance', '+', leg.amount),
            version: eb('version', '+', 1),
            updated_at: new Date(),
          }))
          .where('user_id', '=', leg.account.userId)
          .where('currency', '=', leg.account.currency)
          .returning('balance')
          .executeTakeFirstOrThrow();

        balanceAfter = wallet.balance;
        balances.set(leg.account.currency, wallet.balance);
      }

      await tx
        .insertInto('entries')
        .values({
          tx_id: transaction.id,
          account_id: accountId,
          amount: leg.amount,
          type: leg.type,
          balance_after: balanceAfter,
        })
        .execute();
    }

    return { id: transaction.id, balances };
  }

  private async resolveAccount(tx: Tx, ref: AccountRef): Promise<string> {
    const query = tx.selectFrom('accounts').select('id').where('currency', '=', ref.currency);

    const row =
      ref.kind === 'USER_WALLET'
        ? await query
            .where('kind', '=', 'USER_WALLET')
            .where('owner_id', '=', ref.userId)
            .executeTakeFirst()
        : await query
            .where('kind', '=', ref.kind)
            .where('owner_type', '=', 'SYSTEM')
            .executeTakeFirst();

    if (!row) throw new Error(`Счёт не найден: ${JSON.stringify(ref)}`);
    return row.id;
  }
}

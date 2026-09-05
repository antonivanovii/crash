import { Injectable } from '@nestjs/common';
import argon2 from 'argon2';
import { createHash, randomBytes } from 'node:crypto';
import { Unauthorized } from '../../common/errors/domain.error.js';
import { DatabaseService } from '../../database/database.service.js';
import { SeedService } from '../fairness/seed.service.js';
import { WalletService } from '../wallet/wallet.service.js';
import type { AuthenticatedUser } from './current-user.decorator.js';

const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Сессии, а не JWT.
 *
 * Сессию можно отозвать в тот момент, когда она отзывается: при самоисключении,
 * при смене пароля, при подозрении на угон. JWT до истечения живёт своей жизнью,
 * а в проекте, где сессия управляет доступом к деньгам, это неприемлемо.
 *
 * В БД лежит хэш токена: утечка дампа не даёт войти ни в один аккаунт.
 */
@Injectable()
export class AuthService {
  constructor(
    private readonly database: DatabaseService,
    private readonly wallets: WalletService,
    private readonly seeds: SeedService,
  ) {}

  static hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  /**
   * Регистрация создаёт не только пользователя: без кошелька и активной пары
   * сидов аккаунт нерабочий, поэтому всё делается одной транзакцией.
   */
  async register(input: { email: string; password: string; currency: string }) {
    const passwordHash = await argon2.hash(input.password, { type: argon2.argon2id });

    return this.database.transaction(async (tx) => {
      const user = await tx
        .insertInto('users')
        .values({
          email: input.email.toLowerCase(),
          password_hash: passwordHash,
          display_name: input.email.split('@')[0] ?? 'player',
          currency: input.currency,
        })
        .returning(['id', 'email', 'display_name', 'currency'])
        .executeTakeFirstOrThrow();

      await this.wallets.ensureWallet(tx, user.id, input.currency);
      await this.seeds.createInitialPair(tx, user.id);

      return user;
    });
  }

  async login(
    input: { email: string; password: string },
    meta: { userAgent?: string; ip?: string },
  ) {
    const user = await this.database.db
      .selectFrom('users')
      .select(['id', 'email', 'display_name', 'currency', 'password_hash'])
      .where('email', '=', input.email.toLowerCase())
      .executeTakeFirst();

    // Пароль проверяется всегда, даже когда пользователя нет: иначе время
    // ответа выдаёт, какие email зарегистрированы.
    const hash =
      user?.password_hash ??
      '$argon2id$v=19$m=65536,t=3,p=4$' + 'A'.repeat(22) + '$' + 'A'.repeat(43);
    const ok = await argon2.verify(hash, input.password).catch(() => false);

    if (!user || !ok) throw new Unauthorized('Неверная пара почты и пароля.');

    const token = randomBytes(32).toString('base64url');
    await this.database.db
      .insertInto('sessions')
      .values({
        user_id: user.id,
        token_hash: AuthService.hashToken(token),
        user_agent: meta.userAgent ?? null,
        ip: meta.ip ?? null,
        expires_at: new Date(Date.now() + SESSION_TTL_MS),
      })
      .execute();

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.display_name,
        currency: user.currency,
      } satisfies AuthenticatedUser,
    };
  }

  async validate(token: string): Promise<AuthenticatedUser | null> {
    const row = await this.database.db
      .selectFrom('sessions')
      .innerJoin('users', 'users.id', 'sessions.user_id')
      .select(['users.id', 'users.email', 'users.display_name', 'users.currency'])
      .where('sessions.token_hash', '=', AuthService.hashToken(token))
      .where('sessions.revoked_at', 'is', null)
      .where('sessions.expires_at', '>', new Date())
      .executeTakeFirst();

    if (!row) return null;
    return { id: row.id, email: row.email, displayName: row.display_name, currency: row.currency };
  }

  async logout(token: string): Promise<void> {
    await this.database.db
      .updateTable('sessions')
      .set({ revoked_at: new Date() })
      .where('token_hash', '=', AuthService.hashToken(token))
      .execute();
  }
}

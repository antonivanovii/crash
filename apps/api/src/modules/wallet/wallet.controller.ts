import { paginationSchema } from '@kobold/contracts';
import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { zodBody } from '../../common/validation/zod-validation.pipe.js';
import { AuthGuard } from '../auth/auth.guard.js';
import { CurrentUser, type AuthenticatedUser } from '../auth/current-user.decorator.js';
import { WalletService } from './wallet.service.js';

@Controller('wallet')
@UseGuards(AuthGuard)
export class WalletController {
  constructor(private readonly wallets: WalletService) {}

  @Get('balances')
  async balances(@CurrentUser() user: AuthenticatedUser) {
    const rows = await this.wallets.balances(user.id);
    return rows.map((r) => ({
      currency: r.currency,
      available: r.balance,
      locked: r.locked,
      total: r.balance + r.locked,
    }));
  }

  /**
   * Выписка, а не список: каждая строка несёт баланс после операции и ссылку
   * на источник. Именно это предъявляется при разборе спора.
   */
  @Get('statement')
  async statement(
    @CurrentUser() user: AuthenticatedUser,
    @Query(zodBody(paginationSchema)) query: { limit: number; cursor?: string },
  ) {
    const page = await this.wallets.statement(user.id, query.limit, query.cursor);
    return {
      items: page.items.map((e) => ({
        id: e.id,
        transactionId: e.tx_id,
        type: e.type,
        amount: e.amount,
        balanceAfter: e.balance_after,
        currency: e.currency,
        createdAt: e.created_at,
      })),
      nextCursor: page.nextCursor,
    };
  }
}

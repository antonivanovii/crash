import { games } from '@kobold/contracts';
import { LIMBO_CONFIG, limboWinChance, playLimbo } from '@kobold/game-engine';
import { Body, Controller, Get, Post, UseGuards, UseInterceptors } from '@nestjs/common';
import { IdempotencyKey, Idempotent } from '../../../common/idempotency/idempotency.decorator.js';
import { IdempotencyInterceptor } from '../../../common/idempotency/idempotency.interceptor.js';
import { zodBody } from '../../../common/validation/zod-validation.pipe.js';
import { AuthGuard } from '../../auth/auth.guard.js';
import { CurrentUser, type AuthenticatedUser } from '../../auth/current-user.decorator.js';
import { BetService } from '../_shared/bet.service.js';

/**
 * Limbo целиком — вертикальный срез через весь контур: идемпотентность,
 * блокировки, seed-цепочка, верификатор.
 *
 * Всё, что тут есть, — оркестрация. Математика в `@kobold/game-engine`, та же
 * функция вызывается верификатором в браузере игрока.
 */
@Controller('games/limbo')
@UseGuards(AuthGuard)
@UseInterceptors(IdempotencyInterceptor)
export class LimboController {
  constructor(private readonly bets: BetService) {}

  @Get('config')
  config() {
    return {
      rtp: LIMBO_CONFIG.rtp,
      maxMultiplier: LIMBO_CONFIG.maxMultiplier,
      minTarget: '101',
    };
  }

  @Post('bet')
  @Idempotent()
  async bet(
    @CurrentUser() user: AuthenticatedUser,
    @Body(zodBody(games.limbo.limboBetRequestSchema)) body: games.limbo.LimboBetRequest,
    @IdempotencyKey() key: string,
  ) {
    const bet = await this.bets.placeAtomicBet({
      userId: user.id,
      game: 'limbo',
      currency: body.currency,
      stake: body.stake,
      idempotencyKey: key,
      params: { target: body.target.toString() },
      // Максимум по этой ставке — ровно выбранный таргет: платим по нему,
      // а не по выпавшему множителю.
      maxMultiplier: body.target,
      play: (seed) => playLimbo(seed, { target: body.target }),
    });

    // bigint в ответе превращает в строку BigIntSerializerInterceptor —
    // одинаково для всех ручек и без шанса забыть.
    return { ...bet, winChance: limboWinChance(body.target) };
  }
}

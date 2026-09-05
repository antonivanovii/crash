import { games } from '@kobold/contracts';
import { DICE_CONFIG, diceMultiplier, diceWinChance, playDice } from '@kobold/game-engine';
import { Body, Controller, Get, Post, UseGuards, UseInterceptors } from '@nestjs/common';
import { IdempotencyKey, Idempotent } from '../../../common/idempotency/idempotency.decorator.js';
import { IdempotencyInterceptor } from '../../../common/idempotency/idempotency.interceptor.js';
import { zodBody } from '../../../common/validation/zod-validation.pipe.js';
import { AuthGuard } from '../../auth/auth.guard.js';
import { CurrentUser, type AuthenticatedUser } from '../../auth/current-user.decorator.js';
import { BetService } from '../_shared/bet.service.js';

/**
 * Dice поверх готового BetService. Ровно то, о чём говорит план: новая игра —
 * это функция в движке и сорок строк оркестрации.
 */
@Controller('games/dice')
@UseGuards(AuthGuard)
@UseInterceptors(IdempotencyInterceptor)
export class DiceController {
  constructor(private readonly bets: BetService) {}

  @Get('config')
  config() {
    return { rtp: DICE_CONFIG.rtp, outcomes: 10_000 };
  }

  @Post('bet')
  @Idempotent()
  async bet(
    @CurrentUser() user: AuthenticatedUser,
    @Body(zodBody(games.dice.diceBetRequestSchema)) body: games.dice.DiceBetRequest,
    @IdempotencyKey() key: string,
  ) {
    const params = { target: body.target, direction: body.direction };

    const bet = await this.bets.placeAtomicBet({
      userId: user.id,
      game: 'dice',
      currency: body.currency,
      stake: body.stake,
      idempotencyKey: key,
      params,
      maxMultiplier: diceMultiplier(params),
      play: (seed) => playDice(seed, params),
    });

    return { ...bet, winChance: diceWinChance(params) };
  }
}

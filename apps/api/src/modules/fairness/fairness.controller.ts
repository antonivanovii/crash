import { rotateSeedRequestSchema } from '@kobold/contracts';
import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { zodBody } from '../../common/validation/zod-validation.pipe.js';
import { AuthGuard } from '../auth/auth.guard.js';
import { CurrentUser, type AuthenticatedUser } from '../auth/current-user.decorator.js';
import { SeedService } from './seed.service.js';

/**
 * Provably fair — рабочий раздел, а не сноска в футере. Всё, что нужно игроку
 * для проверки, отдаётся отсюда; сам пересчёт происходит в браузере тем же
 * кодом из game-engine.
 */
@Controller('fairness')
@UseGuards(AuthGuard)
export class FairnessController {
  constructor(private readonly seeds: SeedService) {}

  @Get('seeds')
  async seeds_(@CurrentUser() user: AuthenticatedUser) {
    return {
      active: await this.seeds.activePair(user.id),
      revealed: await this.seeds.history(user.id),
    };
  }

  @Post('seeds/rotate')
  async rotate(
    @CurrentUser() user: AuthenticatedUser,
    @Body(zodBody(rotateSeedRequestSchema)) body: { clientSeed?: string },
  ) {
    return this.seeds.rotate(user.id, body.clientSeed);
  }
}

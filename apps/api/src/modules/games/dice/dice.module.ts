import { Module } from '@nestjs/common';
import { GamesSharedModule } from '../_shared/games.module.js';
import { DiceController } from './dice.controller.js';

@Module({ imports: [GamesSharedModule], controllers: [DiceController] })
export class DiceModule {}

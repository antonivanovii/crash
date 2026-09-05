import { Module } from '@nestjs/common';
import { GamesSharedModule } from '../_shared/games.module.js';
import { LimboController } from './limbo.controller.js';

@Module({ imports: [GamesSharedModule], controllers: [LimboController] })
export class LimboModule {}

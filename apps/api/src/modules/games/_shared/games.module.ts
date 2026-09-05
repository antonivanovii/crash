import { Module } from '@nestjs/common';
import { BetService } from './bet.service.js';

/**
 * Общий слой игр. Каждая игра добавляет модуль на 100–200 строк оркестрации
 * плюс функцию в game-engine — и ничего больше.
 */
@Module({ providers: [BetService], exports: [BetService] })
export class GamesSharedModule {}

import { Module } from '@nestjs/common';
import { BankrollController } from './bankroll.controller.js';

@Module({ controllers: [BankrollController] })
export class BankrollModule {}

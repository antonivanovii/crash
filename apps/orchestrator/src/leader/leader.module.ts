import { Global, Module } from '@nestjs/common';
import { LeaderService } from './leader.service.js';

@Global()
@Module({ providers: [LeaderService], exports: [LeaderService] })
export class LeaderModule {}

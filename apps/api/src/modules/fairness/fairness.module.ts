import { Global, Module } from '@nestjs/common';
import { FairnessController } from './fairness.controller.js';
import { SeedService } from './seed.service.js';

@Global()
@Module({
  controllers: [FairnessController],
  providers: [SeedService],
  exports: [SeedService],
})
export class FairnessModule {}

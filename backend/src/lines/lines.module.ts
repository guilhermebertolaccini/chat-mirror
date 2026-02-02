import { Module } from '@nestjs/common';
import { LinesService } from './lines.service';
import { LinesController } from './lines.controller';

@Module({
  providers: [LinesService],
  controllers: [LinesController]
})
export class LinesModule {}

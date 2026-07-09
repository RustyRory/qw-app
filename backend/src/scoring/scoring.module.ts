import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScoreRisque } from './entities/score-risque.entity';
import { ScoringController } from './scoring.controller';
import { ScoringService } from './scoring.service';

@Module({
  imports: [TypeOrmModule.forFeature([ScoreRisque])],
  controllers: [ScoringController],
  providers: [ScoringService],
})
export class ScoringModule {}

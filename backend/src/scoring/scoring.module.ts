import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import Redis from 'ioredis';
import { RiskScore } from './entities/risk-score.entity';
import { AuditLog } from '../audit/entities/audit-log.entity';
import { ScoringController } from './scoring.controller';
import { ScoringService } from './scoring.service';

@Module({
  imports: [TypeOrmModule.forFeature([RiskScore, AuditLog])],
  controllers: [ScoringController],
  providers: [
    ScoringService,
    {
      provide: 'REDIS_CLIENT',
      useFactory: () =>
        new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379'),
    },
  ],
})
export class ScoringModule {}

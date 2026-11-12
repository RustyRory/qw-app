import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Prospect } from './entities/prospect.entity';
import { AuditLog } from '../audit/entities/audit-log.entity';
import { ScoringModule } from '../scoring/scoring.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { ObligationsModule } from '../obligations/obligations.module';
import { ProspectsService } from './prospects.service';
import { ProspectsController } from './prospects.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Prospect, AuditLog]),
    ScoringModule,
    NotificationsModule,
    ObligationsModule,
  ],
  controllers: [ProspectsController],
  providers: [ProspectsService],
})
export class ProspectsModule {}

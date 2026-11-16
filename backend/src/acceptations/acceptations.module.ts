import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AcceptationMission } from './entities/acceptation-mission.entity';
import { AcceptationsService } from './acceptations.service';
import { AcceptationsController } from './acceptations.controller';
import { AuditModule } from '../audit/audit.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { ObligationsModule } from '../obligations/obligations.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([AcceptationMission]),
    AuditModule,
    NotificationsModule,
    ObligationsModule,
  ],
  controllers: [AcceptationsController],
  providers: [AcceptationsService],
  exports: [AcceptationsService],
})
export class AcceptationsModule {}

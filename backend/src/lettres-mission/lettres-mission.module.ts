import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LettreMission } from './entities/lettre-mission.entity';
import { Mission } from '../missions/entities/mission.entity';
import { Prospect } from '../prospects/entities/prospect.entity';
import { LettresMissionService } from './lettres-mission.service';
import { LettresMissionController } from './lettres-mission.controller';
import { DocusignWebhookController } from './docusign-webhook.controller';
import { DocusignModule } from '../docusign/docusign.module';
import { AuditModule } from '../audit/audit.module';
import { PlanningModule } from '../planning/planning.module';
import { ObligationsModule } from '../obligations/obligations.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([LettreMission, Mission, Prospect]),
    DocusignModule,
    AuditModule,
    PlanningModule,
    ObligationsModule,
    NotificationsModule,
  ],
  controllers: [LettresMissionController, DocusignWebhookController],
  providers: [LettresMissionService],
  exports: [LettresMissionService],
})
export class LettresMissionModule {}

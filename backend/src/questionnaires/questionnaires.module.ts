import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuestionnaireAcceptation } from './entities/questionnaire-acceptation.entity';
import { Prospect } from '../prospects/entities/prospect.entity';
import { ScoringModule } from '../scoring/scoring.module';
import { AuditModule } from '../audit/audit.module';
import { PlanningModule } from '../planning/planning.module';
import { ObligationsModule } from '../obligations/obligations.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { QuestionnairesService } from './questionnaires.service';
import { QuestionnairesController } from './questionnaires.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([QuestionnaireAcceptation, Prospect]),
    ScoringModule,
    AuditModule,
    PlanningModule,
    ObligationsModule,
    NotificationsModule,
  ],
  controllers: [QuestionnairesController],
  providers: [QuestionnairesService],
  exports: [QuestionnairesService],
})
export class QuestionnairesModule {}

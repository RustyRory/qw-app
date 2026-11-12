import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LettreMission } from './entities/lettre-mission.entity';
import { Mission } from '../missions/entities/mission.entity';
import { Prospect } from '../prospects/entities/prospect.entity';
import { LettresMissionService } from './lettres-mission.service';
import { LettresMissionController } from './lettres-mission.controller';
import { AuditModule } from '../audit/audit.module';
import { ObligationsModule } from '../obligations/obligations.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { CabinetModule } from '../cabinet/cabinet.module';
import { DocumentsModule } from '../documents/documents.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([LettreMission, Mission, Prospect]),
    AuditModule,
    ObligationsModule,
    NotificationsModule,
    CabinetModule,
    DocumentsModule,
  ],
  controllers: [LettresMissionController],
  providers: [LettresMissionService],
  exports: [LettresMissionService],
})
export class LettresMissionModule {}

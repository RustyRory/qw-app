import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LettreMission } from './entities/lettre-mission.entity';
import { Mission } from '../missions/entities/mission.entity';
import { LettresMissionService } from './lettres-mission.service';
import { LettresMissionController } from './lettres-mission.controller';
import { DocusignWebhookController } from './docusign-webhook.controller';
import { DocusignModule } from '../docusign/docusign.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([LettreMission, Mission]),
    DocusignModule,
    AuditModule,
  ],
  controllers: [LettresMissionController, DocusignWebhookController],
  providers: [LettresMissionService],
  exports: [LettresMissionService],
})
export class LettresMissionModule {}

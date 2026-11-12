import { Module } from '@nestjs/common';
import { QuestionnaireAcceptation } from '../questionnaires/entities/questionnaire-acceptation.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { BeneficiaireEffectif } from '../beneficiaires/entities/beneficiaire-effectif.entity';
import { ScoreRisque } from '../scoring/entities/score-risque.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Obligation } from './entities/obligation.entity';
import { Document } from '../documents/entities/document.entity';
import { Client } from '../clients/entities/client.entity';
import { Prospect } from '../prospects/entities/prospect.entity';
import { ObligationsService } from './obligations.service';
import { ObligationsController } from './obligations.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Obligation,
      Document,
      Client,
      Prospect,
      BeneficiaireEffectif,
      ScoreRisque,
      QuestionnaireAcceptation,
    ]),
    NotificationsModule,
  ],
  controllers: [ObligationsController],
  providers: [ObligationsService],
  exports: [ObligationsService],
})
export class ObligationsModule {}

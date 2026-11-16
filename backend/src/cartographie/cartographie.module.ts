import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Prospect } from '../prospects/entities/prospect.entity';
import { Client } from '../clients/entities/client.entity';
import { QuestionnaireAcceptation } from '../questionnaires/entities/questionnaire-acceptation.entity';
import { AcceptationMission } from '../acceptations/entities/acceptation-mission.entity';
import { BeneficiaireEffectif } from '../beneficiaires/entities/beneficiaire-effectif.entity';
import { Mission } from '../missions/entities/mission.entity';
import { ScoreRisque } from '../scoring/entities/score-risque.entity';
import { LettreMission } from '../lettres-mission/entities/lettre-mission.entity';
import { Obligation } from '../obligations/entities/obligation.entity';
import { Document } from '../documents/entities/document.entity';
import { ScreeningCorrespondance } from '../screening/entities/screening-correspondance.entity';
import { CabinetModule } from '../cabinet/cabinet.module';
import { AuditModule } from '../audit/audit.module';
import { CartographieService } from './cartographie.service';
import { RapportCartographieService } from './rapport.service';
import { CartographieController } from './cartographie.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Prospect,
      Client,
      QuestionnaireAcceptation,
      AcceptationMission,
      BeneficiaireEffectif,
      Mission,
      ScoreRisque,
      LettreMission,
      Obligation,
      Document,
      ScreeningCorrespondance,
    ]),
    CabinetModule,
    AuditModule,
  ],
  controllers: [CartographieController],
  providers: [CartographieService, RapportCartographieService],
})
export class CartographieModule {}

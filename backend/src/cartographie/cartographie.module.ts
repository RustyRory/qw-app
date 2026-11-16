import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Prospect } from '../prospects/entities/prospect.entity';
import { Client } from '../clients/entities/client.entity';
import { QuestionnaireAcceptation } from '../questionnaires/entities/questionnaire-acceptation.entity';
import { AcceptationMission } from '../acceptations/entities/acceptation-mission.entity';
import { BeneficiaireEffectif } from '../beneficiaires/entities/beneficiaire-effectif.entity';
import { Mission } from '../missions/entities/mission.entity';
import { CartographieService } from './cartographie.service';
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
    ]),
  ],
  controllers: [CartographieController],
  providers: [CartographieService],
})
export class CartographieModule {}

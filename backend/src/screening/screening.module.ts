import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScreeningCorrespondance } from './entities/screening-correspondance.entity';
import { Client } from '../clients/entities/client.entity';
import { Prospect } from '../prospects/entities/prospect.entity';
import { BeneficiaireEffectif } from '../beneficiaires/entities/beneficiaire-effectif.entity';
import { AuditModule } from '../audit/audit.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { ScoringModule } from '../scoring/scoring.module';
import { ScreeningService } from './screening.service';
import { RegistreGelsService } from './registre-gels.service';
import { ScreeningController } from './screening.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ScreeningCorrespondance,
      Client,
      Prospect,
      BeneficiaireEffectif,
    ]),
    AuditModule,
    NotificationsModule,
    ScoringModule,
  ],
  controllers: [ScreeningController],
  providers: [ScreeningService, RegistreGelsService],
  exports: [ScreeningService],
})
export class ScreeningModule {}

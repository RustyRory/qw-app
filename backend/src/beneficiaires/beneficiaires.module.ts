import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BeneficiaireEffectif } from './entities/beneficiaire-effectif.entity';
import { Client } from '../clients/entities/client.entity';
import { ScoringModule } from '../scoring/scoring.module';
import { BeneficiairesService } from './beneficiaires.service';
import { BeneficiairesController } from './beneficiaires.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([BeneficiaireEffectif, Client]),
    ScoringModule,
  ],
  controllers: [BeneficiairesController],
  providers: [BeneficiairesService],
  exports: [BeneficiairesService],
})
export class BeneficiairesModule {}

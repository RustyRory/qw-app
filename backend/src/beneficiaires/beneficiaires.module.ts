import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BeneficiaireEffectif } from './entities/beneficiaire-effectif.entity';
import { BeneficiairesService } from './beneficiaires.service';
import { BeneficiairesController } from './beneficiaires.controller';

@Module({
  imports: [TypeOrmModule.forFeature([BeneficiaireEffectif])],
  controllers: [BeneficiairesController],
  providers: [BeneficiairesService],
  exports: [BeneficiairesService],
})
export class BeneficiairesModule {}

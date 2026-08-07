import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlanningEtape } from './entities/planning-etape.entity';
import { Mission } from '../missions/entities/mission.entity';
import { Obligation } from '../obligations/entities/obligation.entity';
import { Client } from '../clients/entities/client.entity';
import { Prospect } from '../prospects/entities/prospect.entity';
import { ObligationsModule } from '../obligations/obligations.module';
import { PlanningService } from './planning.service';
import { PlanningController } from './planning.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PlanningEtape,
      Mission,
      Obligation,
      Client,
      Prospect,
    ]),
    ObligationsModule,
  ],
  controllers: [PlanningController],
  providers: [PlanningService],
  exports: [PlanningService],
})
export class PlanningModule {}

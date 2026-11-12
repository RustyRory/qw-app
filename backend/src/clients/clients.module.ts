import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Client } from './entities/client.entity';
import { AuditLog } from '../audit/entities/audit-log.entity';
import { ScoringModule } from '../scoring/scoring.module';
import { ObligationsModule } from '../obligations/obligations.module';
import { LettresMissionModule } from '../lettres-mission/lettres-mission.module';
import { ClientsController } from './clients.controller';
import { ClientsService } from './clients.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Client, AuditLog]),
    ScoringModule,
    ObligationsModule,
    LettresMissionModule,
  ],
  controllers: [ClientsController],
  providers: [ClientsService],
  exports: [ClientsService],
})
export class ClientsModule {}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LettreMission } from './entities/lettre-mission.entity';
import { LettresMissionService } from './lettres-mission.service';
import { LettresMissionController } from './lettres-mission.controller';

@Module({
  imports: [TypeOrmModule.forFeature([LettreMission])],
  controllers: [LettresMissionController],
  providers: [LettresMissionService],
  exports: [LettresMissionService],
})
export class LettresMissionModule {}

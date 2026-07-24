import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Mission } from './entities/mission.entity';
import { MissionsService } from './missions.service';
import { MissionsController } from './missions.controller';
import { LettresMissionModule } from '../lettres-mission/lettres-mission.module';

@Module({
  imports: [TypeOrmModule.forFeature([Mission]), LettresMissionModule],
  controllers: [MissionsController],
  providers: [MissionsService],
  exports: [MissionsService],
})
export class MissionsModule {}

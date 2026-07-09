import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Mission } from './entities/mission.entity';
import { MissionsService } from './missions.service';
import { MissionsController } from './missions.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Mission])],
  controllers: [MissionsController],
  providers: [MissionsService],
  exports: [MissionsService],
})
export class MissionsModule {}

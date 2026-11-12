import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ParametresCabinet } from './cabinet.entity';
import { CabinetService } from './cabinet.service';
import { CabinetController } from './cabinet.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ParametresCabinet])],
  controllers: [CabinetController],
  providers: [CabinetService],
  exports: [CabinetService],
})
export class CabinetModule {}

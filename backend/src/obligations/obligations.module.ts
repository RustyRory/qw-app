import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Obligation } from './entities/obligation.entity';
import { ObligationsService } from './obligations.service';
import { ObligationsController } from './obligations.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Obligation])],
  controllers: [ObligationsController],
  providers: [ObligationsService],
  exports: [ObligationsService],
})
export class ObligationsModule {}

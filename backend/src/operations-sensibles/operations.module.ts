import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OperationSensible } from './entities/operation-sensible.entity';
import { OperationsService } from './operations.service';
import { OperationsController } from './operations.controller';

@Module({
  imports: [TypeOrmModule.forFeature([OperationSensible])],
  controllers: [OperationsController],
  providers: [OperationsService],
  exports: [OperationsService],
})
export class OperationsModule {}

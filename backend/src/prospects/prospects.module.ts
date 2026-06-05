import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Prospect } from './entities/prospect.entity';
import { AuditLog } from '../audit/entities/audit-log.entity';
import { ProspectsService } from './prospects.service';
import { ProspectsController } from './prospects.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Prospect, AuditLog])],
  controllers: [ProspectsController],
  providers: [ProspectsService],
})
export class ProspectsModule {}

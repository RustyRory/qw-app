import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Document } from './entities/document.entity';
import { AuditLog } from '../audit/entities/audit-log.entity';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';

@Module({
  imports: [TypeOrmModule.forFeature([Document, AuditLog])],
  controllers: [DocumentsController],
  providers: [DocumentsService],
})
export class DocumentsModule {}

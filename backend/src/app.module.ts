import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { User } from './users/entities/user.entity';
import { Client } from './clients/entities/client.entity';
import { Kyc } from './kyc/entities/kyc.entity';
import { Document } from './documents/entities/document.entity';
import { RiskScore } from './scoring/entities/risk-score.entity';
import { AuditLog } from './audit/entities/audit-log.entity';
import { AuthModule } from './auth/auth.module';
import { ClientsModule } from './clients/clients.module';
import { KycModule } from './kyc/kyc.module';
import { DocumentsModule } from './documents/documents.module';
import { ScoringModule } from './scoring/scoring.module';
import { AuditModule } from './audit/audit.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      entities: [User, Client, Kyc, Document, RiskScore, AuditLog],
      migrations: ['dist/migrations/*.js'],
      synchronize: false,
    }),
    AuthModule,
    ClientsModule,
    KycModule,
    DocumentsModule,
    ScoringModule,
    AuditModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

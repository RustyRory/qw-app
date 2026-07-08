import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { User } from './users/entities/user.entity';
import { Client } from './clients/entities/client.entity';
import { Document } from './documents/entities/document.entity';
import { RiskScore } from './scoring/entities/risk-score.entity';
import { AuditLog } from './audit/entities/audit-log.entity';
import { Prospect } from './prospects/entities/prospect.entity';
import { QuestionnaireAcceptation } from './questionnaires/entities/questionnaire-acceptation.entity';
import { BeneficiaireEffectif } from './beneficiaires/entities/beneficiaire-effectif.entity';
import { Contact } from './contacts/entities/contact.entity';
import { Mission } from './missions/entities/mission.entity';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ClientsModule } from './clients/clients.module';
import { DocumentsModule } from './documents/documents.module';
import { ScoringModule } from './scoring/scoring.module';
import { AuditModule } from './audit/audit.module';
import { ProspectsModule } from './prospects/prospects.module';
import { QuestionnairesModule } from './questionnaires/questionnaires.module';
import { BeneficiairesModule } from './beneficiaires/beneficiaires.module';
import { ContactsModule } from './contacts/contacts.module';
import { MissionsModule } from './missions/missions.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      entities: [
        User,
        Client,
        Document,
        RiskScore,
        AuditLog,
        Prospect,
        QuestionnaireAcceptation,
        BeneficiaireEffectif,
        Contact,
        Mission,
      ],
      migrations: ['dist/migrations/*.js'],
      migrationsRun: true,
      synchronize: false,
    }),
    AuthModule,
    UsersModule,
    ClientsModule,
    DocumentsModule,
    ScoringModule,
    AuditModule,
    ProspectsModule,
    QuestionnairesModule,
    BeneficiairesModule,
    ContactsModule,
    MissionsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';

// Entities
import { User } from './users/entities/user.entity';
import { Prospect } from './prospects/entities/prospect.entity';
import { QuestionnaireAcceptation } from './questionnaires/entities/questionnaire-acceptation.entity';
import { Client } from './clients/entities/client.entity';
import { BeneficiaireEffectif } from './beneficiaires/entities/beneficiaire-effectif.entity';
import { Contact } from './contacts/entities/contact.entity';
import { Mission } from './missions/entities/mission.entity';
import { Document } from './documents/entities/document.entity';
import { LettreMission } from './lettres-mission/entities/lettre-mission.entity';
import { ScoreRisque } from './scoring/entities/score-risque.entity';
import { PlanningEtape } from './planning/entities/planning-etape.entity';
import { Obligation } from './obligations/entities/obligation.entity';
import { OperationSensible } from './operations-sensibles/entities/operation-sensible.entity';
import { AuditLog } from './audit/entities/audit-log.entity';

// Modules
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ProspectsModule } from './prospects/prospects.module';
import { QuestionnairesModule } from './questionnaires/questionnaires.module';
import { ClientsModule } from './clients/clients.module';
import { BeneficiairesModule } from './beneficiaires/beneficiaires.module';
import { ContactsModule } from './contacts/contacts.module';
import { MissionsModule } from './missions/missions.module';
import { DocumentsModule } from './documents/documents.module';
import { LettresMissionModule } from './lettres-mission/lettres-mission.module';
import { ScoringModule } from './scoring/scoring.module';
import { PlanningModule } from './planning/planning.module';
import { ObligationsModule } from './obligations/obligations.module';
import { OperationsModule } from './operations-sensibles/operations.module';
import { AuditModule } from './audit/audit.module';

const ALL_ENTITIES = [
  User,
  Prospect,
  QuestionnaireAcceptation,
  Client,
  BeneficiaireEffectif,
  Contact,
  Mission,
  Document,
  LettreMission,
  ScoreRisque,
  PlanningEtape,
  Obligation,
  OperationSensible,
  AuditLog,
];

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      entities: ALL_ENTITIES,
      migrations: ['dist/migrations/*.js'],
      migrationsRun: true,
      synchronize: false,
    }),
    AuthModule,
    UsersModule,
    ProspectsModule,
    QuestionnairesModule,
    ClientsModule,
    BeneficiairesModule,
    ContactsModule,
    MissionsModule,
    DocumentsModule,
    LettresMissionModule,
    ScoringModule,
    PlanningModule,
    ObligationsModule,
    OperationsModule,
    AuditModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

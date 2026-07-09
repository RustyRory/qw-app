import 'reflect-metadata';
import { config } from 'dotenv';
import { DataSource } from 'typeorm';

config();

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

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: ALL_ENTITIES,
  migrations: [
    process.env.NODE_ENV === 'production'
      ? 'dist/migrations/*.js'
      : 'src/migrations/*.ts',
  ],
  synchronize: false,
});

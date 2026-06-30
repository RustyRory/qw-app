import 'reflect-metadata';
import { config } from 'dotenv';
import { DataSource } from 'typeorm';

config();
import { User } from './users/entities/user.entity';
import { Client } from './clients/entities/client.entity';
import { Document } from './documents/entities/document.entity';
import { RiskScore } from './scoring/entities/risk-score.entity';
import { AuditLog } from './audit/entities/audit-log.entity';
import { Prospect } from './prospects/entities/prospect.entity';

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [User, Client, Document, RiskScore, AuditLog, Prospect],
  migrations: [
    process.env.NODE_ENV === 'production'
      ? 'dist/migrations/*.js'
      : 'src/migrations/*.ts',
  ],
  synchronize: false,
});

import 'reflect-metadata';
import { config } from 'dotenv';
import { DataSource } from 'typeorm';

config();
import { User } from './users/entities/user.entity';
import { Client } from './clients/entities/client.entity';
import { Kyc } from './kyc/entities/kyc.entity';
import { Document } from './documents/entities/document.entity';
import { RiskScore } from './scoring/entities/risk-score.entity';
import { AuditLog } from './audit/entities/audit-log.entity';

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [User, Client, Kyc, Document, RiskScore, AuditLog],
  migrations: ['src/migrations/*.ts'],
  synchronize: false,
});

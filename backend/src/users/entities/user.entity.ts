import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Client } from '../../clients/entities/client.entity';
import { Document } from '../../documents/entities/document.entity';
import { RiskScore } from '../../scoring/entities/risk-score.entity';
import { AuditLog } from '../../audit/entities/audit-log.entity';

export enum UserRole {
  COLLABORATEUR = 'collaborateur',
  RESPONSABLE = 'responsable',
  EXPERT_COMPTABLE = 'expert-comptable',
  ADMIN = 'admin',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 255 })
  passwordHash: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.COLLABORATEUR })
  role: UserRole;

  @Column({ type: 'varchar', length: 100 })
  prenom: string;

  @Column({ type: 'varchar', length: 100 })
  nom: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  lastLoginAt: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @OneToMany(() => Client, (client) => client.createur)
  clientsCrees: Client[];

  @OneToMany(() => Client, (client) => client.validateur)
  clientsValides: Client[];

  @OneToMany(() => Document, (document) => document.utilisateur)
  documents: Document[];

  @OneToMany(() => RiskScore, (riskScore) => riskScore.utilisateur)
  riskScores: RiskScore[];

  @OneToMany(() => AuditLog, (auditLog) => auditLog.utilisateur)
  auditLogs: AuditLog[];
}

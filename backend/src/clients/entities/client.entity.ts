import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  OneToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Kyc } from '../../kyc/entities/kyc.entity';
import { Document } from '../../documents/entities/document.entity';
import { RiskScore } from '../../scoring/entities/risk-score.entity';

export enum ClientStatut {
  EN_COURS = 'en_cours',
  VALIDE = 'valide',
  REJETE = 'rejete',
}

@Entity('clients')
@Index('idx_clients_statut', ['statut'])
@Index('idx_clients_deleted_at', ['deletedAt'])
@Index('idx_clients_id_createur', ['createur'])
export class Client {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  reference: string;

  @Column({ type: 'varchar', length: 100 })
  prenom: string;

  @Column({ type: 'varchar', length: 100 })
  nom: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  raisonSociale: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  telephone: string | null;

  @Column({ type: 'enum', enum: ClientStatut, default: ClientStatut.EN_COURS })
  statut: ClientStatut;

  @DeleteDateColumn({ type: 'timestamptz' })
  deletedAt: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @ManyToOne(() => User, (user) => user.clientsCrees, { nullable: false })
  @JoinColumn({ name: 'id_createur' })
  createur: User;

  @ManyToOne(() => User, (user) => user.clientsValides, { nullable: true })
  @JoinColumn({ name: 'id_validateur' })
  validateur: User | null;

  @OneToOne(() => Kyc, (kyc) => kyc.client)
  kyc: Kyc;

  @OneToMany(() => Document, (document) => document.client)
  documents: Document[];

  @OneToMany(() => RiskScore, (riskScore) => riskScore.client)
  riskScores: RiskScore[];
}

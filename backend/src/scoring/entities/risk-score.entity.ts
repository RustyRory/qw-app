import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Client } from '../../clients/entities/client.entity';
import { User } from '../../users/entities/user.entity';

export enum RiskNiveau {
  FAIBLE = 'faible',
  MOYEN = 'moyen',
  ELEVE = 'eleve',
}

@Entity('risk_scores')
@Index('idx_risk_scores_id_client', ['client'])
export class RiskScore {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'smallint' })
  score: number;

  @Column({ type: 'enum', enum: RiskNiveau })
  niveau: RiskNiveau;

  @Column({ type: 'jsonb', nullable: true })
  details: Record<string, unknown> | null;

  @Column({ type: 'timestamptz', default: () => 'NOW()' })
  calculatedAt: Date;

  @ManyToOne(() => Client, (client) => client.riskScores, { nullable: false })
  @JoinColumn({ name: 'id_client' })
  client: Client;

  @ManyToOne(() => User, (user) => user.riskScores, { nullable: false })
  @JoinColumn({ name: 'id_utilisateur' })
  utilisateur: User;
}

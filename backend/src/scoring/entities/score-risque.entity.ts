import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Client } from '../../clients/entities/client.entity';
import { Prospect } from '../../prospects/entities/prospect.entity';
import { User } from '../../users/entities/user.entity';
import { NiveauRisque } from '../../common/enums';
import { AutoScoreReponses } from '../auto-score.util';

export interface ArpecReponses {
  clientCaracteristiques: number; // 0-50
  activiteSecteur: number; // 0-40
  zoneGeographique: number; // 0-30
  typeMission: number; // 0-30
}

@Entity('score_risque')
@Index('idx_score_client_date', ['client', 'createdAt'])
@Index('idx_score_prospect_date', ['prospect', 'createdAt'])
export class ScoreRisque {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'integer' })
  score: number;

  @Column({ type: 'enum', enum: NiveauRisque })
  niveau: NiveauRisque;

  // ArpecReponses pour un score client (manuel), AutoScoreReponses pour un
  // score prospect (calculé automatiquement depuis le questionnaire d'acceptation).
  @Column({ type: 'jsonb' })
  reponses: ArpecReponses | AutoScoreReponses;

  @ManyToOne(() => Client, (client) => client.scores, { nullable: true })
  @JoinColumn({ name: 'id_client' })
  client: Client | null;

  @ManyToOne(() => Prospect, (prospect) => prospect.scores, { nullable: true })
  @JoinColumn({ name: 'id_prospect' })
  prospect: Prospect | null;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'id_calculated_by' })
  calculatedBy: User;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}

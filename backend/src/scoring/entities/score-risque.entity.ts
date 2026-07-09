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
import { User } from '../../users/entities/user.entity';
import { NiveauRisque } from '../../common/enums';

export interface ArpecReponses {
  clientCaracteristiques: number; // 0-50
  activiteSecteur: number; // 0-40
  zoneGeographique: number; // 0-30
  typeMission: number; // 0-30
}

@Entity('score_risque')
@Index('idx_score_client_date', ['client', 'createdAt'])
export class ScoreRisque {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'integer' })
  score: number;

  @Column({ type: 'enum', enum: NiveauRisque })
  niveau: NiveauRisque;

  @Column({ type: 'jsonb' })
  reponses: ArpecReponses;

  @ManyToOne(() => Client, (client) => client.scores, { nullable: false })
  @JoinColumn({ name: 'id_client' })
  client: Client;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'id_calculated_by' })
  calculatedBy: User;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}

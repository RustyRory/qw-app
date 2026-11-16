import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Prospect } from '../../prospects/entities/prospect.entity';
import { Client } from '../../clients/entities/client.entity';
import { User } from '../../users/entities/user.entity';
import type { ReponseAcceptation } from '../catalogue';

export enum StatutAcceptation {
  EN_COURS = 'EN_COURS',
  ACCEPTEE = 'ACCEPTEE',
}

// Questionnaire d'acceptation (puis de maintien annuel) de la mission :
// un par dossier. Rempli sur le prospect avant la lettre de mission, puis
// rattaché au client à la conversion et rouvert chaque année.
@Entity('acceptation_mission')
export class AcceptationMission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Prospect, { nullable: true })
  @JoinColumn({ name: 'id_prospect' })
  prospect: Prospect | null;

  @ManyToOne(() => Client, { nullable: true })
  @JoinColumn({ name: 'id_client' })
  client: Client | null;

  @Column({ type: 'jsonb', default: {} })
  reponses: Record<string, ReponseAcceptation>;

  @Column({
    type: 'enum',
    enum: StatutAcceptation,
    default: StatutAcceptation.EN_COURS,
  })
  statut: StatutAcceptation;

  // Décision de l'expert-comptable (non délégable).
  @Column({ type: 'timestamptz', nullable: true })
  decideeAt: Date | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'id_decidee_par' })
  decideePar: User | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'id_rempli_par' })
  rempliPar: User | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}

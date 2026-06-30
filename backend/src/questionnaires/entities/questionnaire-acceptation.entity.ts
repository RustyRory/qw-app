import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToOne,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Prospect } from '../../prospects/entities/prospect.entity';

export enum StatutQuestionnaire {
  EN_COURS = 'EN_COURS',
  VALIDE = 'VALIDE',
  REFUSE = 'REFUSE',
}

@Entity('questionnaire_acceptation')
export class QuestionnaireAcceptation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => Prospect, (p) => p.questionnaire, { nullable: false })
  @JoinColumn({ name: 'id_prospect' })
  prospect: Prospect;

  @Column({
    type: 'enum',
    enum: StatutQuestionnaire,
    default: StatutQuestionnaire.EN_COURS,
  })
  statut: StatutQuestionnaire;

  @Column({ type: 'jsonb', nullable: true })
  reponses: Record<string, unknown> | null;

  @Column({ type: 'text', nullable: true })
  motifRefus: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  validatedAt: Date | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'id_validated_by' })
  validatedBy: User | null;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'id_createur' })
  createdBy: User;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}

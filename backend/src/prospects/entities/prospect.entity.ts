import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { QuestionnaireAcceptation } from '../../questionnaires/entities/questionnaire-acceptation.entity';

export enum ProspectStatut {
  NOUVEAU = 'nouveau',
  EN_ANALYSE = 'en_analyse',
  CONVERTI = 'converti',
  REJETE = 'rejete',
}

@Entity('prospects')
@Index('idx_prospects_statut', ['statut'])
@Index('idx_prospects_id_createur', ['createur'])
export class Prospect {
  @PrimaryGeneratedColumn('uuid')
  id: string;

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

  @Column({ type: 'varchar', length: 200, nullable: true })
  secteurActivite: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  paysResidence: string | null;

  @Column({ type: 'boolean', default: false })
  estPep: boolean;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({
    type: 'enum',
    enum: ProspectStatut,
    default: ProspectStatut.NOUVEAU,
  })
  statut: ProspectStatut;

  // Renseigné lors de la conversion en client
  @Column({ type: 'uuid', nullable: true })
  clientId: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'id_createur' })
  createur: User;

  @OneToOne(
    () => QuestionnaireAcceptation,
    (questionnaire) => questionnaire.prospect,
    {
      nullable: true,
    },
  )
  questionnaire: QuestionnaireAcceptation | null;
}

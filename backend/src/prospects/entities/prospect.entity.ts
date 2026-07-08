import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Client } from '../../clients/entities/client.entity';
import { QuestionnaireAcceptation } from '../../questionnaires/entities/questionnaire-acceptation.entity';
import { TypeEntite, StatutKanban } from '../../common/enums';

@Entity('prospects')
@Index('idx_prospect_statut', ['statutKanban'], {
  where: '"deletedAt" IS NULL',
})
@Index('idx_prospect_siret', ['siret'], { where: '"siret" IS NOT NULL' })
export class Prospect {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 20, unique: true })
  ref: string;

  @Column({ type: 'varchar', length: 14, nullable: true })
  siret: string | null;

  @Column({ type: 'varchar', length: 255 })
  nom: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  telephone: string | null;

  @Column({
    type: 'enum',
    enum: TypeEntite,
    default: TypeEntite.PERSONNE_MORALE,
  })
  typeEntite: TypeEntite;

  @Column({
    type: 'enum',
    enum: StatutKanban,
    default: StatutKanban.PRISE_CONTACT,
  })
  statutKanban: StatutKanban;

  @Column({ type: 'text', nullable: true })
  motifRefus: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  activite: string | null;

  @Column({ type: 'varchar', length: 10, nullable: true })
  codeNaf: string | null;

  @Column({ type: 'text', nullable: true })
  adresse: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  ville: string | null;

  @Column({ type: 'varchar', length: 10, nullable: true })
  codePostal: string | null;

  @Column({ type: 'varchar', length: 100, default: 'France' })
  pays: string;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  chiffreAffaires: number | null;

  @Column({ type: 'integer', nullable: true })
  effectif: number | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'id_createur' })
  createdBy: User;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'id_assigned' })
  assignedTo: User | null;

  @OneToOne(
    () => QuestionnaireAcceptation,
    (questionnaire) => questionnaire.prospect,
    { nullable: true },
  )
  questionnaire: QuestionnaireAcceptation | null;

  @OneToOne(() => Client, (client) => client.prospect, { nullable: true })
  @JoinColumn({ name: 'id_client' })
  client: Client | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamptz' })
  deletedAt: Date | null;
}

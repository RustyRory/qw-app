import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Document } from '../../documents/entities/document.entity';
import { ScoreRisque } from '../../scoring/entities/score-risque.entity';
import { Prospect } from '../../prospects/entities/prospect.entity';
import { BeneficiaireEffectif } from '../../beneficiaires/entities/beneficiaire-effectif.entity';
import { Contact } from '../../contacts/entities/contact.entity';
import { Mission } from '../../missions/entities/mission.entity';
import { PlanningEtape } from '../../planning/entities/planning-etape.entity';
import { Obligation } from '../../obligations/entities/obligation.entity';
import { OperationSensible } from '../../operations-sensibles/entities/operation-sensible.entity';
import {
  TypeEntite,
  StatutClient,
  StatutKyc,
  ScreeningStatut,
} from '../../common/enums';

@Entity('clients')
@Index('idx_client_statut', ['statut'])
@Index('idx_client_siret', ['siret'])
export class Client {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 20, unique: true })
  ref: string;

  @Column({ type: 'varchar', length: 14, nullable: true })
  siret: string | null;

  @Column({ type: 'varchar', length: 9, nullable: true })
  siren: string | null;

  @Column({ type: 'varchar', length: 255 })
  raisonSociale: string;

  @Column({ type: 'enum', enum: TypeEntite })
  typeEntite: TypeEntite;

  @Column({ type: 'varchar', length: 100, nullable: true })
  formeJuridique: string | null;

  @Column({ type: 'varchar', length: 10, nullable: true })
  codeNaf: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  activitePrincipale: string | null;

  @Column({ type: 'date', nullable: true })
  dateCreationEntreprise: Date | null;

  @Column({ type: 'text', nullable: true })
  adresseSiege: string | null;

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
  natureMission: string | null;

  @Column({ type: 'enum', enum: StatutClient, default: StatutClient.ACTIF })
  statut: StatutClient;

  @Column({ type: 'timestamptz', nullable: true })
  sireneUpdatedAt: Date | null;

  // ── Champs KYC fusionnés ──────────────────────────────────────────────
  @Column({ type: 'enum', enum: StatutKyc, default: StatutKyc.INCOMPLET })
  kycStatut: StatutKyc;

  @Column({ type: 'boolean', default: false })
  ppe: boolean;

  @Column({ type: 'text', nullable: true })
  ppeDetail: string | null;

  @Column({ type: 'boolean', default: false })
  uboSaisi: boolean;

  @Column({
    type: 'enum',
    enum: ScreeningStatut,
    default: ScreeningStatut.NON_EFFECTUE,
  })
  screeningStatut: ScreeningStatut;

  @Column({ type: 'timestamptz', nullable: true })
  screeningDate: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  kycCompletedAt: Date | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'id_kyc_validator' })
  kycValidatedBy: User | null;

  @DeleteDateColumn({ type: 'timestamptz' })
  deletedAt: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'id_createur' })
  createdBy: User;

  @OneToMany(() => Document, (document) => document.client)
  documents: Document[];

  @OneToMany(() => ScoreRisque, (score) => score.client)
  scores: ScoreRisque[];

  @OneToOne(() => Prospect, (prospect) => prospect.client)
  prospect: Prospect | null;

  @OneToMany(() => BeneficiaireEffectif, (beneficiaire) => beneficiaire.client)
  beneficiaires: BeneficiaireEffectif[];

  @OneToMany(() => Contact, (contact) => contact.client)
  contacts: Contact[];

  @OneToMany(() => Mission, (mission) => mission.client)
  missions: Mission[];

  @OneToMany(() => PlanningEtape, (etape) => etape.client)
  planningEtapes: PlanningEtape[];

  @OneToMany(() => Obligation, (obligation) => obligation.client)
  obligations: Obligation[];

  @OneToMany(() => OperationSensible, (operation) => operation.client)
  operationsSensibles: OperationSensible[];
}

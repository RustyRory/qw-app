import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Mission } from '../../missions/entities/mission.entity';
import { DocusignStatutEnvelope } from '../../common/enums';

@Entity('lettre_mission')
export class LettreMission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'integer', default: 1 })
  version: number;

  @Column({ type: 'jsonb' })
  contenu: Record<string, unknown>;

  // Étape intermédiaire obligatoire avant la signature de l'expert-comptable :
  // le responsable valide le contenu (répartition des travaux, honoraires…)
  // préparé par le collaborateur.
  @Column({ type: 'boolean', default: false })
  valideeParResponsable: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  valideeAt: Date | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'id_valide_par' })
  valideePar: User | null;

  @Column({ type: 'boolean', default: false })
  signeeParExpert: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  signeeAt: Date | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  cheminStockage: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  signeeParClientAt: Date | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  docusignEnvelopeId: string | null;

  @Column({
    type: 'enum',
    enum: DocusignStatutEnvelope,
    nullable: true,
  })
  docusignStatut: DocusignStatutEnvelope | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  docusignDestinataireEmail: string | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  docusignDestinataireNom: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  docusignEnvoyeAt: Date | null;

  @ManyToOne(() => Mission, (mission) => mission.lettresMission, {
    nullable: false,
  })
  @JoinColumn({ name: 'id_mission' })
  mission: Mission;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'id_signataire' })
  signataire: User | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}

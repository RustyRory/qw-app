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
import { Document } from '../../documents/entities/document.entity';

// Circuit : générée → validée (responsable / EC / admin) → signée par
// l'expert-comptable → envoyée au client par l'utilisateur (mail perso) →
// PDF signé par le client déposé par l'EC / l'admin.
// Toute modification d'une version signée crée une nouvelle version
// (avenant) ; les versions précédentes restent consultables.
@Entity('lettre_mission')
export class LettreMission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'integer', default: 1 })
  version: number;

  @Column({ type: 'jsonb' })
  contenu: Record<string, unknown>;

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

  // PDF généré (signé par l'EC une fois la signature apposée), côté serveur.
  @Column({ type: 'varchar', length: 500, nullable: true })
  cheminStockage: string | null;

  // Emplacement du PDF signé par l'EC dans le dossier local de l'utilisateur
  // (Clients|Prospects/<Réf> <Nom>/<Nom>-LettreMission-<Type>-<Date>.pdf).
  @Column({ type: 'varchar', length: 500, nullable: true })
  cheminRelatif: string | null;

  // Signature du client : date d'enregistrement du PDF signé déposé.
  @Column({ type: 'timestamptz', nullable: true })
  signeeParClientAt: Date | null;

  @ManyToOne(() => Document, { nullable: true })
  @JoinColumn({ name: 'id_document_signe_client' })
  documentSigneClient: Document | null;

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

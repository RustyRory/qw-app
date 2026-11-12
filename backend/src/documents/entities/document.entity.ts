import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Check,
} from 'typeorm';
import { Client } from '../../clients/entities/client.entity';
import { Prospect } from '../../prospects/entities/prospect.entity';
import { User } from '../../users/entities/user.entity';
import { Contact } from '../../contacts/entities/contact.entity';
import { Mission } from '../../missions/entities/mission.entity';
import { PlanningEtape } from '../../planning/entities/planning-etape.entity';
import { OperationSensible } from '../../operations-sensibles/entities/operation-sensible.entity';
import { TypeDocument } from '../../common/enums';

@Entity('documents')
@Index('idx_documents_id_client', ['client'])
@Index('idx_documents_id_prospect', ['prospect'])
@Check(
  'CHK_documents_client_xor_prospect',
  '("id_client" IS NULL) <> ("id_prospect" IS NULL)',
)
export class Document {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: TypeDocument, default: TypeDocument.AUTRE })
  type: TypeDocument;

  // Nom normalisé « Nom-Type-JJ-MM-AAAA.ext » (cf. common/storage.ts).
  @Column({ type: 'varchar', length: 255 })
  nomFichier: string;

  // Nom du fichier tel que déposé par l'utilisateur.
  @Column({ type: 'varchar', length: 255, nullable: true })
  nomOriginal: string | null;

  // Emplacement dans le dossier local de l'utilisateur (séparateur « / ») :
  // Clients/<Réf> <Nom>/<nomFichier>. Le fichier est aussi conservé côté
  // serveur dans `cheminStockage`.
  @Column({ type: 'varchar', length: 500, nullable: true })
  cheminRelatif: string | null;

  // Date de fin de validité de la pièce (Kbis, pièce d'identité…).
  @Column({ type: 'date', nullable: true })
  dateExpiration: string | null;

  @Column({ type: 'varchar', length: 500 })
  cheminStockage: string;

  @Column({ type: 'varchar', length: 100 })
  typeMime: string;

  @Column({ type: 'bigint' })
  taille: number;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @DeleteDateColumn({ type: 'timestamptz' })
  deletedAt: Date | null;

  // Exactement un des deux est renseigné : un document déposé avant la
  // conversion appartient au prospect, puis il est transféré au client.
  // Voir contrainte CHK_documents_client_xor_prospect.
  @ManyToOne(() => Client, (client) => client.documents, { nullable: true })
  @JoinColumn({ name: 'id_client' })
  client: Client | null;

  @ManyToOne(() => Prospect, { nullable: true })
  @JoinColumn({ name: 'id_prospect' })
  prospect: Prospect | null;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'id_utilisateur' })
  utilisateur: User;

  // Rattachements optionnels : un document peut en plus être rattaché à une
  // sous-entité précise du dossier (contact, mission, étape de planning ou
  // opération sensible) pour le distinguer des autres documents du même
  // client.
  @ManyToOne(() => Contact, { nullable: true })
  @JoinColumn({ name: 'id_contact' })
  contact: Contact | null;

  @ManyToOne(() => Mission, { nullable: true })
  @JoinColumn({ name: 'id_mission' })
  mission: Mission | null;

  @ManyToOne(() => PlanningEtape, { nullable: true })
  @JoinColumn({ name: 'id_planning_etape' })
  planningEtape: PlanningEtape | null;

  @ManyToOne(() => OperationSensible, { nullable: true })
  @JoinColumn({ name: 'id_operation_sensible' })
  operationSensible: OperationSensible | null;
}

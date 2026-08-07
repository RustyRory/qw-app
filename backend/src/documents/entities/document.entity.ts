import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Client } from '../../clients/entities/client.entity';
import { User } from '../../users/entities/user.entity';
import { Contact } from '../../contacts/entities/contact.entity';
import { Mission } from '../../missions/entities/mission.entity';
import { PlanningEtape } from '../../planning/entities/planning-etape.entity';
import { OperationSensible } from '../../operations-sensibles/entities/operation-sensible.entity';
import { TypeDocument } from '../../common/enums';

@Entity('documents')
@Index('idx_documents_id_client', ['client'])
export class Document {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: TypeDocument, default: TypeDocument.AUTRE })
  type: TypeDocument;

  @Column({ type: 'varchar', length: 255 })
  nomFichier: string;

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

  @ManyToOne(() => Client, (client) => client.documents, { nullable: false })
  @JoinColumn({ name: 'id_client' })
  client: Client;

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

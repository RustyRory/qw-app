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

@Entity('documents')
@Index('idx_documents_id_client', ['client'])
export class Document {
  @PrimaryGeneratedColumn('uuid')
  id: string;

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

  @ManyToOne(() => Client, (client) => client.documents, { nullable: false })
  @JoinColumn({ name: 'id_client' })
  client: Client;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'id_utilisateur' })
  utilisateur: User;
}

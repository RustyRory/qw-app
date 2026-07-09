import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Client } from '../../clients/entities/client.entity';
import { TypeContact } from '../../common/enums';

@Entity('contacts')
export class Contact {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  prenom: string | null;

  @Column({ type: 'varchar', length: 100 })
  nom: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  telephone: string | null;

  @Column({ type: 'enum', enum: TypeContact, default: TypeContact.AUTRE })
  type: TypeContact;

  @Column({ type: 'text', nullable: true })
  roleDetail: string | null;

  @ManyToOne(() => Client, (client) => client.contacts, { nullable: false })
  @JoinColumn({ name: 'id_client' })
  client: Client;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}

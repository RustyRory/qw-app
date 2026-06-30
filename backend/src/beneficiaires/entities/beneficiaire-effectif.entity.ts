import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Client } from '../../clients/entities/client.entity';

@Entity('beneficiaire_effectif')
export class BeneficiaireEffectif {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  prenom: string | null;

  @Column({ type: 'varchar', length: 100 })
  nom: string;

  @Column({ type: 'date', nullable: true })
  dateNaissance: Date | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  nationalite: string | null;

  @Column({ type: 'text', nullable: true })
  adresse: string | null;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  pourcentageDetention: number;

  @Column({ type: 'boolean', default: false })
  ppe: boolean;

  @ManyToOne(() => Client, (client) => client.beneficiaires, {
    nullable: false,
  })
  @JoinColumn({ name: 'id_client' })
  client: Client;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}

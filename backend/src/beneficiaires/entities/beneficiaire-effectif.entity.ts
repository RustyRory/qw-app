import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Check,
} from 'typeorm';
import { Client } from '../../clients/entities/client.entity';
import { Prospect } from '../../prospects/entities/prospect.entity';

@Entity('beneficiaire_effectif')
@Check(
  'CHK_beneficiaire_client_xor_prospect',
  '("id_client" IS NULL) <> ("id_prospect" IS NULL)',
)
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

  // Saisi dès le stade prospect, puis transféré au client à la conversion.
  @ManyToOne(() => Client, { nullable: true })
  @JoinColumn({ name: 'id_client' })
  client: Client | null;

  @ManyToOne(() => Prospect, { nullable: true })
  @JoinColumn({ name: 'id_prospect' })
  prospect: Prospect | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}

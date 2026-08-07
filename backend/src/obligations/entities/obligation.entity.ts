import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Client } from '../../clients/entities/client.entity';
import { Prospect } from '../../prospects/entities/prospect.entity';
import { TypeObligation, StatutObligation } from '../../common/enums';

@Entity('obligations')
export class Obligation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: TypeObligation })
  type: TypeObligation;

  @Column({
    type: 'enum',
    enum: StatutObligation,
    default: StatutObligation.A_FAIRE,
  })
  statut: StatutObligation;

  @Column({ type: 'date', nullable: true })
  dateEcheance: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  completedAt: Date | null;

  // Exactement un des deux doit être renseigné : une obligation « prospect »
  // (pipeline LAB → lettre de mission, avant conversion) ou une obligation
  // d'un client déjà converti. Voir contrainte CHK_obligations_client_xor_prospect.
  @ManyToOne(() => Client, (client) => client.obligations, {
    nullable: true,
  })
  @JoinColumn({ name: 'id_client' })
  client: Client | null;

  @ManyToOne(() => Prospect, (prospect) => prospect.obligations, {
    nullable: true,
  })
  @JoinColumn({ name: 'id_prospect' })
  prospect: Prospect | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}

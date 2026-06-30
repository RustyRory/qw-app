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

  @ManyToOne(() => Client, (client) => client.obligations, {
    nullable: false,
  })
  @JoinColumn({ name: 'id_client' })
  client: Client;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}

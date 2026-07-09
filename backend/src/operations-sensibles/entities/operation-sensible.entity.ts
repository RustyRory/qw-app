import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Client } from '../../clients/entities/client.entity';
import {
  TypeOperationSensible,
  StatutOperationSensible,
} from '../../common/enums';

@Entity('operation_sensible')
@Index('idx_operation_statut', ['client', 'statut'])
export class OperationSensible {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: TypeOperationSensible })
  type: TypeOperationSensible;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  montant: number | null;

  @Column({ type: 'varchar', length: 3, nullable: true })
  devise: string | null;

  @Column({
    type: 'enum',
    enum: StatutOperationSensible,
    default: StatutOperationSensible.SIGNALEE,
  })
  statut: StatutOperationSensible;

  @Column({ type: 'timestamptz', nullable: true })
  tracfinDate: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  validatedAt: Date | null;

  @ManyToOne(() => Client, (client) => client.operationsSensibles, {
    nullable: false,
  })
  @JoinColumn({ name: 'id_client' })
  client: Client;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'id_validated_by' })
  validatedBy: User | null;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'id_signale_by' })
  signaleBy: User;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}

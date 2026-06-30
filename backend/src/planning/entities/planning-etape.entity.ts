import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Client } from '../../clients/entities/client.entity';
import { TypePlanningEtape, StatutPlanningEtape } from '../../common/enums';

@Entity('planning_etape')
export class PlanningEtape {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  titre: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'enum', enum: TypePlanningEtape })
  type: TypePlanningEtape;

  @Column({
    type: 'enum',
    enum: StatutPlanningEtape,
    default: StatutPlanningEtape.A_FAIRE,
  })
  statut: StatutPlanningEtape;

  @Column({ type: 'date', nullable: true })
  dateEcheance: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  completedAt: Date | null;

  @ManyToOne(() => Client, (client) => client.planningEtapes, {
    nullable: false,
  })
  @JoinColumn({ name: 'id_client' })
  client: Client;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'id_completed_by' })
  completedBy: User | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'id_assigned_to' })
  assignedTo: User | null;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'id_createur' })
  createdBy: User;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}

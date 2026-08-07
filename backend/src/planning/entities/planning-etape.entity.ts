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
import { Prospect } from '../../prospects/entities/prospect.entity';
import { Mission } from '../../missions/entities/mission.entity';
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

  // Exactement un des deux doit être renseigné : une étape « prospect »
  // (pipeline LAB → lettre de mission, avant conversion) ou une étape d'un
  // client déjà converti. Voir contrainte CHK_planning_etape_client_xor_prospect.
  @ManyToOne(() => Client, (client) => client.planningEtapes, {
    nullable: true,
  })
  @JoinColumn({ name: 'id_client' })
  client: Client | null;

  @ManyToOne(() => Prospect, (prospect) => prospect.planningEtapes, {
    nullable: true,
  })
  @JoinColumn({ name: 'id_prospect' })
  prospect: Prospect | null;

  // Renseigné uniquement pour les étapes de renouvellement générées
  // automatiquement à partir d'une mission (voir PlanningService).
  @ManyToOne(() => Mission, { nullable: true })
  @JoinColumn({ name: 'id_mission' })
  mission: Mission | null;

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

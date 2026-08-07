import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

// Pas d'enum de type dédié : titre/message en texte libre, sur le même
// principe que PlanningEtape.titre — évite un mapping de labels à
// maintenir côté frontend à chaque nouvel événement notifié.
@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'id_user' })
  user: User;

  @Column({ type: 'varchar', length: 255 })
  titre: string;

  @Column({ type: 'text', nullable: true })
  message: string | null;

  // Chemin frontend à ouvrir au clic (ex. /dashboard/prospects/:id).
  @Column({ type: 'varchar', length: 500, nullable: true })
  lien: string | null;

  @Column({ type: 'boolean', default: false })
  lu: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  luAt: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}

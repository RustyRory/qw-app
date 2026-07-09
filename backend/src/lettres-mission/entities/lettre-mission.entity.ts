import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Mission } from '../../missions/entities/mission.entity';

@Entity('lettre_mission')
export class LettreMission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'integer', default: 1 })
  version: number;

  @Column({ type: 'jsonb' })
  contenu: Record<string, unknown>;

  @Column({ type: 'boolean', default: false })
  signeeParExpert: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  signeeAt: Date | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  s3Key: string | null;

  @ManyToOne(() => Mission, (mission) => mission.lettresMission, {
    nullable: false,
  })
  @JoinColumn({ name: 'id_mission' })
  mission: Mission;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'id_signataire' })
  signataire: User | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}

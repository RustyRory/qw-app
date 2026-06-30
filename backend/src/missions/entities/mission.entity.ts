import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Client } from '../../clients/entities/client.entity';
import { LettreMission } from '../../lettres-mission/entities/lettre-mission.entity';
import { TypeMission, StatutMission } from '../../common/enums';

@Entity('missions')
export class Mission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: TypeMission })
  type: TypeMission;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({
    type: 'enum',
    enum: StatutMission,
    default: StatutMission.EN_COURS,
  })
  statut: StatutMission;

  @Column({ type: 'date' })
  dateDebut: Date;

  @Column({ type: 'date', nullable: true })
  dateFin: Date | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  honoraires: number | null;

  @ManyToOne(() => Client, (client) => client.missions, { nullable: false })
  @JoinColumn({ name: 'id_client' })
  client: Client;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'id_createur' })
  createdBy: User;

  @OneToMany(() => LettreMission, (lettre) => lettre.mission)
  lettresMission: LettreMission[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}

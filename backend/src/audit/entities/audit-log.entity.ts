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

export enum AuditAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  READ = 'READ',
  VALIDATE = 'VALIDATE',
  LOGIN = 'LOGIN',
}

@Entity('audit_logs')
@Index('idx_audit_ressource', ['ressource', 'ressourceId'])
@Index('idx_audit_user', ['utilisateur'])
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: AuditAction })
  action: AuditAction;

  @Column({ type: 'varchar', length: 50 })
  ressource: string;

  @Column({ type: 'uuid' })
  ressourceId: string;

  @Column({ type: 'jsonb', nullable: true })
  details: Record<string, unknown> | null;

  @Column({ type: 'varchar', length: 45, nullable: true })
  ipAddress: string | null;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'id_utilisateur' })
  utilisateur: User;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}

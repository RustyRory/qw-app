import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
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
@Index('idx_audit_logs_id_utilisateur', ['utilisateur'])
@Index('idx_audit_logs_entite', ['entiteType', 'entiteId'])
@Index('idx_audit_logs_created_at', ['createdAt'])
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: AuditAction })
  action: AuditAction;

  @Column({ type: 'varchar', length: 50 })
  entiteType: string;

  @Column({ type: 'uuid' })
  entiteId: string;

  @Column({ type: 'jsonb', nullable: true })
  details: Record<string, unknown> | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @ManyToOne(() => User, (user) => user.auditLogs, { nullable: false })
  @JoinColumn({ name: 'id_utilisateur' })
  utilisateur: User;
}

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditAction, AuditLog } from './entities/audit-log.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditRepo: Repository<AuditLog>,
  ) {}

  log(
    userId: string,
    action: AuditAction,
    entiteType: string,
    entiteId: string,
    details: Record<string, unknown> | null = null,
  ): Promise<AuditLog> {
    return this.auditRepo.save(
      this.auditRepo.create({
        action,
        entiteType,
        entiteId,
        details,
        utilisateur: { id: userId } as User,
      }),
    );
  }

  findAll(): Promise<AuditLog[]> {
    return this.auditRepo.find({
      relations: ['utilisateur'],
      order: { createdAt: 'DESC' },
    });
  }

  findByEntite(entiteId: string): Promise<AuditLog[]> {
    return this.auditRepo.find({
      where: { entiteId },
      relations: ['utilisateur'],
      order: { createdAt: 'DESC' },
    });
  }
}

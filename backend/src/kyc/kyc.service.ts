import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { Redis } from 'ioredis';
import { Kyc } from './entities/kyc.entity';
import { AuditAction, AuditLog } from '../audit/entities/audit-log.entity';
import { User, UserRole } from '../users/entities/user.entity';
import { UpdateKycDto } from './dto/update-kyc.dto';

type AuthUser = { id: string; role: UserRole };

const KYC_CACHE_TTL = 300;

@Injectable()
export class KycService {
  constructor(
    @InjectRepository(Kyc)
    private readonly kycRepo: Repository<Kyc>,
    @InjectRepository(AuditLog)
    private readonly auditRepo: Repository<AuditLog>,
    @Inject('REDIS_CLIENT')
    private readonly redis: Redis,
  ) {}

  private cacheKey(clientId: string): string {
    return `kyc:${clientId}`;
  }

  async findByClient(clientId: string): Promise<Kyc> {
    const key = this.cacheKey(clientId);
    const cached = await this.redis.get(key);
    if (cached) return JSON.parse(cached) as Kyc;

    const kyc = await this.kycRepo.findOne({
      where: { client: { id: clientId } },
      relations: ['client'],
    });
    if (!kyc) throw new NotFoundException('Fiche KYC introuvable');

    await this.redis.setex(key, KYC_CACHE_TTL, JSON.stringify(kyc));
    return kyc;
  }

  async update(
    clientId: string,
    dto: UpdateKycDto,
    authUser: AuthUser,
  ): Promise<Kyc> {
    const kyc = await this.kycRepo.findOne({
      where: { client: { id: clientId } },
    });
    if (!kyc) throw new NotFoundException('Fiche KYC introuvable');

    Object.assign(kyc, dto);
    const saved = await this.kycRepo.save(kyc);

    await this.auditRepo.save(
      this.auditRepo.create({
        action: AuditAction.UPDATE,
        entiteType: 'Kyc',
        entiteId: kyc.id,
        details: dto as Record<string, unknown>,
        utilisateur: { id: authUser.id } as User,
      }),
    );

    await this.redis.del(this.cacheKey(clientId));

    return saved;
  }
}

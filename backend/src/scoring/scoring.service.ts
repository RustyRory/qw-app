import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { Redis } from 'ioredis';
import { ArpecReponses, RiskScore } from './entities/risk-score.entity';
import { NiveauRisque, Role } from '../common/enums';
import { AuditAction, AuditLog } from '../audit/entities/audit-log.entity';
import { Client } from '../clients/entities/client.entity';
import { User } from '../users/entities/user.entity';
import { CreateScoreDto } from './dto/create-score.dto';

type AuthUser = { id: string; role: Role };

const SCORING_CACHE_TTL = 3600;

export function computeNiveau(score: number): NiveauRisque {
  if (score <= 40) return NiveauRisque.FAIBLE;
  if (score <= 80) return NiveauRisque.MOYEN;
  return NiveauRisque.ELEVE;
}

@Injectable()
export class ScoringService {
  constructor(
    @InjectRepository(RiskScore)
    private readonly riskScoreRepo: Repository<RiskScore>,
    @InjectRepository(AuditLog)
    private readonly auditRepo: Repository<AuditLog>,
    @Inject('REDIS_CLIENT')
    private readonly redis: Redis,
  ) {}

  async calculate(
    clientId: string,
    dto: CreateScoreDto,
    authUser: AuthUser,
  ): Promise<RiskScore> {
    const reponses: ArpecReponses = { ...dto };
    const score =
      dto.clientCaracteristiques +
      dto.activiteSecteur +
      dto.zoneGeographique +
      dto.typeMission;
    const niveau = computeNiveau(score);

    const riskScore = await this.riskScoreRepo.save(
      this.riskScoreRepo.create({
        score,
        niveau,
        reponses,
        client: { id: clientId } as Client,
        utilisateur: { id: authUser.id } as User,
      }),
    );

    await this.auditRepo.save(
      this.auditRepo.create({
        action: AuditAction.CREATE,
        entiteType: 'RiskScore',
        entiteId: riskScore.id,
        details: { score, niveau } as Record<string, unknown>,
        utilisateur: { id: authUser.id } as User,
      }),
    );

    await this.redis.setex(
      `scoring:${clientId}`,
      SCORING_CACHE_TTL,
      JSON.stringify(riskScore),
    );

    return riskScore;
  }

  findByClient(clientId: string): Promise<RiskScore[]> {
    return this.riskScoreRepo.find({
      where: { client: { id: clientId } },
      order: { createdAt: 'DESC' },
    });
  }
}

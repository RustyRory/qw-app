import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { Redis } from 'ioredis';
import { RiskNiveau, RiskScore } from './entities/risk-score.entity';
import { Kyc } from '../kyc/entities/kyc.entity';
import { AuditAction, AuditLog } from '../audit/entities/audit-log.entity';
import { Client } from '../clients/entities/client.entity';
import { User, UserRole } from '../users/entities/user.entity';

type AuthUser = { id: string; role: UserRole };

const SECTEURS_RISQUE = [
  'crypto',
  'cryptomonnaie',
  'casino',
  'jeux',
  'gambling',
  'forex',
  'change',
  'immobilier',
  'luxe',
];

const CA_ELEVE_SEUIL = 500_000;
const SCORING_CACHE_TTL = 300;

interface ScoreResult {
  score: number;
  niveau: RiskNiveau;
  details: Record<string, number>;
}

function computeScore(kyc: Kyc): ScoreResult {
  let score = 0;
  const details: Record<string, number> = {};

  if (kyc.estPep) {
    score += 30;
    details.pep = 30;
  }
  if (kyc.paysHautRisque) {
    score += 25;
    details.paysHautRisque = 25;
  }

  const secteur = (kyc.secteurActivite ?? '').toLowerCase();
  if (SECTEURS_RISQUE.some((s) => secteur.includes(s))) {
    score += 20;
    details.secteurRisque = 20;
  }

  if ((kyc.chiffreAffaires ?? 0) > CA_ELEVE_SEUIL) {
    score += 10;
    details.chiffreAffairesEleve = 10;
  }

  score = Math.min(score, 100);

  let niveau: RiskNiveau;
  if (score <= 33) niveau = RiskNiveau.FAIBLE;
  else if (score <= 66) niveau = RiskNiveau.MOYEN;
  else niveau = RiskNiveau.ELEVE;

  return { score, niveau, details };
}

@Injectable()
export class ScoringService {
  constructor(
    @InjectRepository(RiskScore)
    private readonly riskScoreRepo: Repository<RiskScore>,
    @InjectRepository(Kyc)
    private readonly kycRepo: Repository<Kyc>,
    @InjectRepository(AuditLog)
    private readonly auditRepo: Repository<AuditLog>,
    @Inject('REDIS_CLIENT')
    private readonly redis: Redis,
  ) {}

  async calculate(clientId: string, authUser: AuthUser): Promise<RiskScore> {
    const kyc = await this.kycRepo.findOne({
      where: { client: { id: clientId } },
    });
    if (!kyc) throw new NotFoundException('Fiche KYC introuvable');

    const { score, niveau, details } = computeScore(kyc);

    const riskScore = await this.riskScoreRepo.save(
      this.riskScoreRepo.create({
        score,
        niveau,
        details,
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
      order: { calculatedAt: 'DESC' },
    });
  }
}

export { computeScore };

import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ScoringService, computeScore } from './scoring.service';
import { RiskNiveau, RiskScore } from './entities/risk-score.entity';
import { Kyc } from '../kyc/entities/kyc.entity';
import { AuditAction, AuditLog } from '../audit/entities/audit-log.entity';
import { UserRole } from '../users/entities/user.entity';

const ADMIN: { id: string; role: UserRole } = {
  id: 'user-1',
  role: UserRole.ADMIN,
};

const makeKyc = (override: Partial<Kyc> = {}): Kyc =>
  ({
    id: 'kyc-1',
    estPep: false,
    paysHautRisque: false,
    secteurActivite: 'Commerce de détail',
    chiffreAffaires: 100_000,
    client: { id: 'client-1' },
    ...override,
  }) as Kyc;

const makeScore = (override: Partial<RiskScore> = {}): RiskScore =>
  ({
    id: 'score-1',
    score: 0,
    niveau: RiskNiveau.FAIBLE,
    details: {},
    calculatedAt: new Date(),
    client: { id: 'client-1' },
    ...override,
  }) as RiskScore;

describe('computeScore (pure)', () => {
  it('retourne 0 / faible si aucun critère', () => {
    const { score, niveau } = computeScore(makeKyc());
    expect(score).toBe(0);
    expect(niveau).toBe(RiskNiveau.FAIBLE);
  });

  it('PEP ajoute 30 pts', () => {
    const { score, details } = computeScore(makeKyc({ estPep: true }));
    expect(score).toBe(30);
    expect(details.pep).toBe(30);
  });

  it('pays haut risque ajoute 25 pts', () => {
    const { score, details } = computeScore(makeKyc({ paysHautRisque: true }));
    expect(score).toBe(25);
    expect(details.paysHautRisque).toBe(25);
  });

  it('secteur risque (casino) ajoute 20 pts', () => {
    const { score, details } = computeScore(
      makeKyc({ secteurActivite: 'Industrie du Casino' }),
    );
    expect(score).toBe(20);
    expect(details.secteurRisque).toBe(20);
  });

  it("chiffre d'affaires > 500 000 ajoute 10 pts", () => {
    const { score, details } = computeScore(
      makeKyc({ chiffreAffaires: 750_000 }),
    );
    expect(score).toBe(10);
    expect(details.chiffreAffairesEleve).toBe(10);
  });

  it('PEP + pays haut risque = 55 pts → moyen', () => {
    const { score, niveau } = computeScore(
      makeKyc({ estPep: true, paysHautRisque: true }),
    );
    expect(score).toBe(55);
    expect(niveau).toBe(RiskNiveau.MOYEN);
  });

  it('tous les critères = 85 pts → élevé', () => {
    const { score, niveau } = computeScore(
      makeKyc({
        estPep: true,
        paysHautRisque: true,
        secteurActivite: 'crypto',
        chiffreAffaires: 1_000_000,
      }),
    );
    expect(score).toBe(85);
    expect(niveau).toBe(RiskNiveau.ELEVE);
  });

  it('le score est plafonné à 100', () => {
    const kyc = makeKyc({
      estPep: true,
      paysHautRisque: true,
      secteurActivite: 'casino',
      chiffreAffaires: 1_000_000,
    });
    const { score } = computeScore(kyc);
    expect(score).toBeLessThanOrEqual(100);
  });
});

describe('ScoringService', () => {
  let service: ScoringService;

  const riskScoreRepoMock = {
    findOne: jest.fn(),
    find: jest.fn(),
    save: jest.fn(),
    create: jest.fn((data) => data),
  };

  const kycRepoMock = {
    findOne: jest.fn(),
  };

  const auditRepoMock = {
    save: jest.fn(),
    create: jest.fn((data) => data),
  };

  const redisMock = {
    setex: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScoringService,
        { provide: getRepositoryToken(RiskScore), useValue: riskScoreRepoMock },
        { provide: getRepositoryToken(Kyc), useValue: kycRepoMock },
        { provide: getRepositoryToken(AuditLog), useValue: auditRepoMock },
        { provide: 'REDIS_CLIENT', useValue: redisMock },
      ],
    }).compile();

    service = module.get<ScoringService>(ScoringService);
  });

  // --------------------------------------------------------------- calculate
  describe('calculate', () => {
    it('persiste le score calculé et enregistre un audit CREATE', async () => {
      kycRepoMock.findOne.mockResolvedValue(makeKyc({ estPep: true }));
      riskScoreRepoMock.save.mockResolvedValue(
        makeScore({ score: 30, niveau: RiskNiveau.FAIBLE }),
      );

      await service.calculate('client-1', ADMIN);

      expect(riskScoreRepoMock.save).toHaveBeenCalledWith(
        expect.objectContaining({
          score: 30,
          niveau: RiskNiveau.FAIBLE,
          client: { id: 'client-1' },
          utilisateur: { id: ADMIN.id },
        }),
      );
      expect(auditRepoMock.save).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.CREATE,
          entiteType: 'RiskScore',
          utilisateur: { id: ADMIN.id },
        }),
      );
    });

    it('met à jour le cache Redis après le calcul', async () => {
      kycRepoMock.findOne.mockResolvedValue(makeKyc());
      const saved = makeScore();
      riskScoreRepoMock.save.mockResolvedValue(saved);

      await service.calculate('client-1', ADMIN);

      expect(redisMock.setex).toHaveBeenCalledWith(
        'scoring:client-1',
        3600,
        JSON.stringify(saved),
      );
    });

    it('lève NotFoundException si la fiche KYC est introuvable', async () => {
      kycRepoMock.findOne.mockResolvedValue(null);

      await expect(service.calculate('inexistant', ADMIN)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ------------------------------------------------------------ findByClient
  describe('findByClient', () => {
    it("retourne l'historique trié par date décroissante", async () => {
      const scores = [makeScore(), makeScore({ id: 'score-2' })];
      riskScoreRepoMock.find.mockResolvedValue(scores);

      const result = await service.findByClient('client-1');

      expect(result).toBe(scores);
      expect(riskScoreRepoMock.find).toHaveBeenCalledWith({
        where: { client: { id: 'client-1' } },
        order: { calculatedAt: 'DESC' },
      });
    });
  });
});

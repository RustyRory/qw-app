import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ScoringService, computeNiveau } from './scoring.service';
import { RiskScore } from './entities/risk-score.entity';
import { AuditAction, AuditLog } from '../audit/entities/audit-log.entity';
import { NiveauRisque, Role } from '../common/enums';
import { CreateScoreDto } from './dto/create-score.dto';

const ADMIN: { id: string; role: Role } = {
  id: 'user-1',
  role: Role.ADMIN,
};

const makeScore = (override: Partial<RiskScore> = {}): RiskScore =>
  ({
    id: 'score-1',
    score: 0,
    niveau: NiveauRisque.FAIBLE,
    reponses: {
      clientCaracteristiques: 0,
      activiteSecteur: 0,
      zoneGeographique: 0,
      typeMission: 0,
    },
    client: { id: 'client-1' },
    ...override,
  }) as RiskScore;

describe('computeNiveau (pure)', () => {
  it('retourne FAIBLE pour un score <= 40', () => {
    expect(computeNiveau(0)).toBe(NiveauRisque.FAIBLE);
    expect(computeNiveau(40)).toBe(NiveauRisque.FAIBLE);
  });

  it('retourne MOYEN pour un score entre 41 et 80', () => {
    expect(computeNiveau(41)).toBe(NiveauRisque.MOYEN);
    expect(computeNiveau(80)).toBe(NiveauRisque.MOYEN);
  });

  it('retourne ELEVE pour un score > 80', () => {
    expect(computeNiveau(81)).toBe(NiveauRisque.ELEVE);
    expect(computeNiveau(150)).toBe(NiveauRisque.ELEVE);
  });
});

describe('ScoringService', () => {
  let service: ScoringService;

  const riskScoreRepoMock = {
    find: jest.fn(),
    save: jest.fn(),
    create: jest.fn((data) => data),
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
        { provide: getRepositoryToken(AuditLog), useValue: auditRepoMock },
        { provide: 'REDIS_CLIENT', useValue: redisMock },
      ],
    }).compile();

    service = module.get<ScoringService>(ScoringService);
  });

  // --------------------------------------------------------------- calculate
  describe('calculate', () => {
    const dto: CreateScoreDto = {
      clientCaracteristiques: 20,
      activiteSecteur: 10,
      zoneGeographique: 5,
      typeMission: 5,
    };

    it('additionne les 4 dimensions ARPEC et persiste le score', async () => {
      riskScoreRepoMock.save.mockResolvedValue(
        makeScore({ score: 40, niveau: NiveauRisque.FAIBLE, reponses: dto }),
      );

      await service.calculate('client-1', dto, ADMIN);

      expect(riskScoreRepoMock.save).toHaveBeenCalledWith(
        expect.objectContaining({
          score: 40,
          niveau: NiveauRisque.FAIBLE,
          reponses: dto,
          client: { id: 'client-1' },
          utilisateur: { id: ADMIN.id },
        }),
      );
    });

    it('enregistre un audit CREATE', async () => {
      riskScoreRepoMock.save.mockResolvedValue(makeScore());

      await service.calculate('client-1', dto, ADMIN);

      expect(auditRepoMock.save).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.CREATE,
          entiteType: 'RiskScore',
          utilisateur: { id: ADMIN.id },
        }),
      );
    });

    it('met à jour le cache Redis après le calcul', async () => {
      const saved = makeScore();
      riskScoreRepoMock.save.mockResolvedValue(saved);

      await service.calculate('client-1', dto, ADMIN);

      expect(redisMock.setex).toHaveBeenCalledWith(
        'scoring:client-1',
        3600,
        JSON.stringify(saved),
      );
    });

    it('un score élevé (>80) est classé ELEVE', async () => {
      const highDto: CreateScoreDto = {
        clientCaracteristiques: 45,
        activiteSecteur: 35,
        zoneGeographique: 25,
        typeMission: 20,
      };
      riskScoreRepoMock.save.mockResolvedValue(makeScore({ score: 125 }));

      await service.calculate('client-1', highDto, ADMIN);

      expect(riskScoreRepoMock.save).toHaveBeenCalledWith(
        expect.objectContaining({ score: 125, niveau: NiveauRisque.ELEVE }),
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
        order: { createdAt: 'DESC' },
      });
    });
  });
});

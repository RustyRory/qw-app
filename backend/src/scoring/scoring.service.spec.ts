import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ScoringService, computeNiveau } from './scoring.service';
import { ScoreRisque } from './entities/score-risque.entity';
import { NiveauRisque } from '../common/enums';
import { CreateScoreDto } from './dto/create-score.dto';

const USER_ID = 'user-1';

const makeScore = (override: Partial<ScoreRisque> = {}): ScoreRisque =>
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
  }) as ScoreRisque;

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

  const repoMock = {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn((data) => data),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScoringService,
        { provide: getRepositoryToken(ScoreRisque), useValue: repoMock },
      ],
    }).compile();

    service = module.get<ScoringService>(ScoringService);
  });

  // --------------------------------------------------------------- calculate
  describe('calculate', () => {
    const dto: CreateScoreDto = {
      clientId: 'client-1',
      clientCaracteristiques: 20,
      activiteSecteur: 10,
      zoneGeographique: 5,
      typeMission: 5,
    };

    it('additionne les 4 dimensions ARPEC et persiste le score', async () => {
      repoMock.save.mockResolvedValue(
        makeScore({ score: 40, niveau: NiveauRisque.FAIBLE }),
      );

      await service.calculate(dto, USER_ID);

      expect(repoMock.save).toHaveBeenCalledWith(
        expect.objectContaining({
          score: 40,
          niveau: NiveauRisque.FAIBLE,
          reponses: {
            clientCaracteristiques: 20,
            activiteSecteur: 10,
            zoneGeographique: 5,
            typeMission: 5,
          },
          client: { id: 'client-1' },
          calculatedBy: { id: USER_ID },
        }),
      );
    });

    it('un score élevé (>80) est classé ELEVE', async () => {
      const highDto: CreateScoreDto = {
        clientId: 'client-1',
        clientCaracteristiques: 45,
        activiteSecteur: 35,
        zoneGeographique: 25,
        typeMission: 20,
      };
      repoMock.save.mockResolvedValue(makeScore({ score: 125 }));

      await service.calculate(highDto, USER_ID);

      expect(repoMock.save).toHaveBeenCalledWith(
        expect.objectContaining({ score: 125, niveau: NiveauRisque.ELEVE }),
      );
    });
  });

  // ------------------------------------------------------------ findByClient
  describe('findByClient', () => {
    it("retourne l'historique trié par date décroissante", async () => {
      const scores = [makeScore(), makeScore({ id: 'score-2' })];
      repoMock.find.mockResolvedValue(scores);

      const result = await service.findByClient('client-1');

      expect(result).toBe(scores);
      expect(repoMock.find).toHaveBeenCalledWith({
        where: { client: { id: 'client-1' } },
        order: { createdAt: 'DESC' },
      });
    });
  });

  // ------------------------------------------------------------- findCurrent
  describe('findCurrent', () => {
    it('retourne le score le plus récent du client', async () => {
      const current = makeScore();
      repoMock.findOne.mockResolvedValue(current);

      const result = await service.findCurrent('client-1');

      expect(result).toBe(current);
      expect(repoMock.findOne).toHaveBeenCalledWith({
        where: { client: { id: 'client-1' } },
        order: { createdAt: 'DESC' },
      });
    });
  });
});

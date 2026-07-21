import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ScoringService } from './scoring.service';
import { ScoreRisque } from './entities/score-risque.entity';
import { Client } from '../clients/entities/client.entity';
import { Prospect } from '../prospects/entities/prospect.entity';
import { BeneficiaireEffectif } from '../beneficiaires/entities/beneficiaire-effectif.entity';
import { QuestionnaireAcceptation } from '../questionnaires/entities/questionnaire-acceptation.entity';
import { NiveauRisque, ScreeningStatut, TypeEntite } from '../common/enums';

const USER_ID = 'user-1';

describe('ScoringService', () => {
  let service: ScoringService;

  const scoreRepoMock = {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn((data) => data),
  };
  const clientRepoMock = { findOne: jest.fn() };
  const prospectRepoMock = { findOneBy: jest.fn() };
  const beneficiaireRepoMock = { find: jest.fn() };
  const questionnaireRepoMock = { findOne: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScoringService,
        { provide: getRepositoryToken(ScoreRisque), useValue: scoreRepoMock },
        { provide: getRepositoryToken(Client), useValue: clientRepoMock },
        { provide: getRepositoryToken(Prospect), useValue: prospectRepoMock },
        {
          provide: getRepositoryToken(BeneficiaireEffectif),
          useValue: beneficiaireRepoMock,
        },
        {
          provide: getRepositoryToken(QuestionnaireAcceptation),
          useValue: questionnaireRepoMock,
        },
      ],
    }).compile();

    service = module.get<ScoringService>(ScoringService);
  });

  // ------------------------------------------------------- recalculateForProspect
  describe('recalculateForProspect', () => {
    it('renvoie null si le prospect est introuvable', async () => {
      prospectRepoMock.findOneBy.mockResolvedValue(null);

      const result = await service.recalculateForProspect(
        'prospect-1',
        USER_ID,
      );

      expect(result).toBeNull();
      expect(scoreRepoMock.save).not.toHaveBeenCalled();
    });

    it('calcule le score depuis le questionnaire et le persiste rattaché au prospect', async () => {
      prospectRepoMock.findOneBy.mockResolvedValue({
        id: 'prospect-1',
        typeEntite: TypeEntite.PERSONNE_PHYSIQUE,
        chiffreAffaires: null,
      });
      questionnaireRepoMock.findOne.mockResolvedValue({
        reponses: { D1_11: 'oui' },
      });
      scoreRepoMock.save.mockResolvedValue({});

      await service.recalculateForProspect('prospect-1', USER_ID);

      expect(scoreRepoMock.save).toHaveBeenCalledWith(
        expect.objectContaining({
          score: Math.round((30 / 155) * 100),
          niveau: NiveauRisque.FAIBLE,
          prospect: { id: 'prospect-1' },
          calculatedBy: { id: USER_ID },
        }),
      );
      expect(scoreRepoMock.save.mock.calls[0][0]).not.toHaveProperty('client');
    });

    it('calcule un score nul quand le prospect n’a pas encore de questionnaire', async () => {
      prospectRepoMock.findOneBy.mockResolvedValue({
        id: 'prospect-1',
        typeEntite: TypeEntite.PERSONNE_MORALE,
        chiffreAffaires: null,
      });
      questionnaireRepoMock.findOne.mockResolvedValue(null);
      scoreRepoMock.save.mockResolvedValue({});

      await service.recalculateForProspect('prospect-1', USER_ID);

      expect(scoreRepoMock.save).toHaveBeenCalledWith(
        expect.objectContaining({ score: 0, niveau: NiveauRisque.FAIBLE }),
      );
    });
  });

  // --------------------------------------------------------- recalculateForClient
  describe('recalculateForClient', () => {
    it('renvoie null si le client est introuvable', async () => {
      clientRepoMock.findOne.mockResolvedValue(null);

      const result = await service.recalculateForClient('client-1', USER_ID);

      expect(result).toBeNull();
      expect(scoreRepoMock.save).not.toHaveBeenCalled();
    });

    it('calcule le score depuis les données réelles du client (ppe, CA) et le persiste rattaché au client', async () => {
      clientRepoMock.findOne.mockResolvedValue({
        id: 'client-1',
        typeEntite: TypeEntite.PERSONNE_PHYSIQUE,
        chiffreAffaires: 600_000,
        ppe: true,
        screeningStatut: ScreeningStatut.OK,
        prospect: null,
      });
      beneficiaireRepoMock.find.mockResolvedValue([]);
      scoreRepoMock.save.mockResolvedValue({});

      await service.recalculateForClient('client-1', USER_ID);

      // ppe (30) + chiffre_affaires (10) = 40 sur 155.
      expect(scoreRepoMock.save).toHaveBeenCalledWith(
        expect.objectContaining({
          score: Math.round((40 / 155) * 100),
          client: { id: 'client-1' },
          calculatedBy: { id: USER_ID },
        }),
      );
      expect(scoreRepoMock.save.mock.calls[0][0]).not.toHaveProperty(
        'prospect',
      );
      expect(questionnaireRepoMock.findOne).not.toHaveBeenCalled();
    });

    it('déclenche les alertes nationales quand le screening est en ALERTE', async () => {
      clientRepoMock.findOne.mockResolvedValue({
        id: 'client-1',
        typeEntite: TypeEntite.PERSONNE_PHYSIQUE,
        chiffreAffaires: null,
        ppe: false,
        screeningStatut: ScreeningStatut.ALERTE,
        prospect: null,
      });
      beneficiaireRepoMock.find.mockResolvedValue([]);
      scoreRepoMock.save.mockResolvedValue({});

      await service.recalculateForClient('client-1', USER_ID);

      // alertes_nationales (20) / 155
      expect(scoreRepoMock.save).toHaveBeenCalledWith(
        expect.objectContaining({ score: Math.round((20 / 155) * 100) }),
      );
    });

    it('complète avec le questionnaire du prospect d’origine si le client en a un', async () => {
      clientRepoMock.findOne.mockResolvedValue({
        id: 'client-1',
        typeEntite: TypeEntite.PERSONNE_MORALE,
        chiffreAffaires: null,
        ppe: false,
        screeningStatut: ScreeningStatut.NON_EFFECTUE,
        prospect: { id: 'prospect-1' },
      });
      beneficiaireRepoMock.find.mockResolvedValue([]);
      questionnaireRepoMock.findOne.mockResolvedValue({
        reponses: { D3_1_1: 'oui' },
      });
      scoreRepoMock.save.mockResolvedValue({});

      await service.recalculateForClient('client-1', USER_ID);

      expect(questionnaireRepoMock.findOne).toHaveBeenCalledWith({
        where: { prospect: { id: 'prospect-1' } },
      });
      // pays_gafi (25) / 155
      expect(scoreRepoMock.save).toHaveBeenCalledWith(
        expect.objectContaining({ score: Math.round((25 / 155) * 100) }),
      );
    });
  });

  // ------------------------------------------------------------ findByClient
  describe('findByClient', () => {
    it("retourne l'historique trié par date décroissante", async () => {
      const scores = [{ id: 'score-1' }, { id: 'score-2' }];
      scoreRepoMock.find.mockResolvedValue(scores);

      const result = await service.findByClient('client-1');

      expect(result).toBe(scores);
      expect(scoreRepoMock.find).toHaveBeenCalledWith({
        where: { client: { id: 'client-1' } },
        order: { createdAt: 'DESC' },
      });
    });
  });

  // ------------------------------------------------------------- findCurrent
  describe('findCurrent', () => {
    it('retourne le score le plus récent du client', async () => {
      const current = { id: 'score-1' };
      scoreRepoMock.findOne.mockResolvedValue(current);

      const result = await service.findCurrent('client-1');

      expect(result).toBe(current);
      expect(scoreRepoMock.findOne).toHaveBeenCalledWith({
        where: { client: { id: 'client-1' } },
        order: { createdAt: 'DESC' },
      });
    });
  });

  // ---------------------------------------------------------- findByProspect
  describe('findByProspect', () => {
    it("retourne l'historique du prospect trié par date décroissante", async () => {
      const scores = [{ id: 'score-1' }, { id: 'score-2' }];
      scoreRepoMock.find.mockResolvedValue(scores);

      const result = await service.findByProspect('prospect-1');

      expect(result).toBe(scores);
      expect(scoreRepoMock.find).toHaveBeenCalledWith({
        where: { prospect: { id: 'prospect-1' } },
        order: { createdAt: 'DESC' },
      });
    });
  });

  // ------------------------------------------------------- findCurrentByProspect
  describe('findCurrentByProspect', () => {
    it('retourne le score le plus récent du prospect', async () => {
      const current = { id: 'score-1' };
      scoreRepoMock.findOne.mockResolvedValue(current);

      const result = await service.findCurrentByProspect('prospect-1');

      expect(result).toBe(current);
      expect(scoreRepoMock.findOne).toHaveBeenCalledWith({
        where: { prospect: { id: 'prospect-1' } },
        order: { createdAt: 'DESC' },
      });
    });
  });
});

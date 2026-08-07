import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PlanningService } from './planning.service';
import { PlanningEtape } from './entities/planning-etape.entity';
import { Mission } from '../missions/entities/mission.entity';
import { Obligation } from '../obligations/entities/obligation.entity';
import { Client } from '../clients/entities/client.entity';
import { Prospect } from '../prospects/entities/prospect.entity';
import { ObligationsService } from '../obligations/obligations.service';
import { StatutPlanningEtape, TypePlanningEtape } from '../common/enums';

describe('PlanningService', () => {
  let service: PlanningService;

  const repoMock = {
    create: jest.fn((data) => data),
    save: jest.fn((entity) => Promise.resolve({ id: 'etape-new', ...entity })),
    find: jest.fn(),
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    remove: jest.fn(),
  };

  const missionRepoMock = { find: jest.fn() };
  const obligationRepoMock = { find: jest.fn() };
  const clientRepoMock = { find: jest.fn() };
  const prospectRepoMock = { findOne: jest.fn() };
  const obligationsServiceMock = {
    marquerEnRetard: jest.fn(),
    synchroniserPourClient: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlanningService,
        { provide: getRepositoryToken(PlanningEtape), useValue: repoMock },
        { provide: getRepositoryToken(Mission), useValue: missionRepoMock },
        {
          provide: getRepositoryToken(Obligation),
          useValue: obligationRepoMock,
        },
        { provide: getRepositoryToken(Client), useValue: clientRepoMock },
        { provide: getRepositoryToken(Prospect), useValue: prospectRepoMock },
        { provide: ObligationsService, useValue: obligationsServiceMock },
      ],
    }).compile();

    service = module.get<PlanningService>(PlanningService);
  });

  // ------------------------------------------------------------------ create
  describe('create', () => {
    const baseDto = {
      titre: 'Étape',
      type: TypePlanningEtape.MANUELLE,
    };

    it('refuse si ni clientId ni prospectId ne sont renseignés', () => {
      expect(() => service.create(baseDto as never, 'user-1')).toThrow(
        BadRequestException,
      );
      expect(repoMock.save).not.toHaveBeenCalled();
    });

    it('refuse si clientId et prospectId sont renseignés ensemble', () => {
      expect(() =>
        service.create(
          {
            ...baseDto,
            clientId: 'client-1',
            prospectId: 'prospect-1',
          },
          'user-1',
        ),
      ).toThrow(BadRequestException);
      expect(repoMock.save).not.toHaveBeenCalled();
    });

    it('crée une étape liée au prospect quand seul prospectId est fourni', async () => {
      await service.create({ ...baseDto, prospectId: 'prospect-1' }, 'user-1');

      expect(repoMock.save).toHaveBeenCalledWith(
        expect.objectContaining({
          client: null,
          prospect: { id: 'prospect-1' },
        }),
      );
    });
  });

  // ----------------------------------------------- ouvrirEtapePourProspect
  describe('ouvrirEtapePourProspect', () => {
    it("n'ouvre pas de doublon si une étape du même titre est déjà ouverte", async () => {
      repoMock.findOne.mockResolvedValue({ id: 'etape-existante' });

      await service.ouvrirEtapePourProspect(
        'prospect-1',
        'Questionnaire à remplir',
      );

      expect(repoMock.save).not.toHaveBeenCalled();
      expect(prospectRepoMock.findOne).not.toHaveBeenCalled();
    });

    it('ouvre une nouvelle étape REGLEMENTAIRE assignée au responsable du prospect', async () => {
      repoMock.findOne.mockResolvedValue(null);
      prospectRepoMock.findOne.mockResolvedValue({
        id: 'prospect-1',
        assignedTo: { id: 'user-resp' },
        createdBy: { id: 'user-createur' },
      });

      await service.ouvrirEtapePourProspect(
        'prospect-1',
        'Questionnaire à remplir',
      );

      expect(repoMock.save).toHaveBeenCalledWith(
        expect.objectContaining({
          prospect: { id: 'prospect-1' },
          titre: 'Questionnaire à remplir',
          type: TypePlanningEtape.REGLEMENTAIRE,
          assignedTo: { id: 'user-resp' },
          createdBy: { id: 'user-createur' },
        }),
      );
    });
  });

  // ------------------------------------------------- fermerEtapePourProspect
  describe('fermerEtapePourProspect', () => {
    it('ne fait rien si aucune étape ouverte du titre demandé', async () => {
      repoMock.findOne.mockResolvedValue(null);

      await service.fermerEtapePourProspect(
        'prospect-1',
        'Questionnaire à remplir',
      );

      expect(repoMock.save).not.toHaveBeenCalled();
    });

    it("marque l'étape ouverte comme FAIT", async () => {
      const ouverte = {
        id: 'etape-1',
        statut: StatutPlanningEtape.A_FAIRE,
        completedAt: null,
      };
      repoMock.findOne.mockResolvedValue(ouverte);

      await service.fermerEtapePourProspect(
        'prospect-1',
        'Questionnaire à remplir',
      );

      expect(repoMock.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'etape-1',
          statut: StatutPlanningEtape.FAIT,
        }),
      );
    });
  });
});

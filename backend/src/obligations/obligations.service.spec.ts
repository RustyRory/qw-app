import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ObligationsService } from './obligations.service';
import { Obligation } from './entities/obligation.entity';
import { Document } from '../documents/entities/document.entity';
import { Client } from '../clients/entities/client.entity';
import { BeneficiaireEffectif } from '../beneficiaires/entities/beneficiaire-effectif.entity';
import { ScoreRisque } from '../scoring/entities/score-risque.entity';
import { StatutObligation, TypeObligation } from '../common/enums';

describe('ObligationsService', () => {
  let service: ObligationsService;

  const repoMock = {
    create: jest.fn((data) => data),
    save: jest.fn((entity) => Promise.resolve({ id: 'obl-new', ...entity })),
    findOne: jest.fn(),
    find: jest.fn(),
    update: jest.fn(),
  };

  const documentRepoMock = { find: jest.fn() };
  const clientRepoMock = { findOneBy: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ObligationsService,
        { provide: getRepositoryToken(Obligation), useValue: repoMock },
        { provide: getRepositoryToken(Document), useValue: documentRepoMock },
        { provide: getRepositoryToken(Client), useValue: clientRepoMock },
        {
          provide: getRepositoryToken(BeneficiaireEffectif),
          useValue: { exists: jest.fn().mockResolvedValue(false) },
        },
        {
          provide: getRepositoryToken(ScoreRisque),
          useValue: { findOne: jest.fn().mockResolvedValue(null) },
        },
      ],
    }).compile();

    service = module.get<ObligationsService>(ObligationsService);
  });

  // ------------------------------------------------------------------ create
  describe('create', () => {
    it('refuse si ni clientId ni prospectId ne sont renseignés', () => {
      expect(() =>
        service.create({ type: TypeObligation.KYC_VERIFICATION }),
      ).toThrow(BadRequestException);
      expect(repoMock.save).not.toHaveBeenCalled();
    });

    it('refuse si clientId et prospectId sont renseignés ensemble', () => {
      expect(() =>
        service.create({
          clientId: 'client-1',
          prospectId: 'prospect-1',
          type: TypeObligation.KYC_VERIFICATION,
        }),
      ).toThrow(BadRequestException);
      expect(repoMock.save).not.toHaveBeenCalled();
    });

    it('crée une obligation liée au prospect quand seul prospectId est fourni', async () => {
      await service.create({
        prospectId: 'prospect-1',
        type: TypeObligation.VALIDATION_RELATION,
      });

      expect(repoMock.save).toHaveBeenCalledWith(
        expect.objectContaining({
          client: null,
          prospect: { id: 'prospect-1' },
          type: TypeObligation.VALIDATION_RELATION,
        }),
      );
    });
  });

  // --------------------------------------------------- ouvrirPourProspect
  describe('ouvrirPourProspect', () => {
    it("n'ouvre pas de doublon si une obligation du même type est déjà ouverte", async () => {
      repoMock.findOne.mockResolvedValue({ id: 'obl-existante' });

      await service.ouvrirPourProspect(
        'prospect-1',
        TypeObligation.VALIDATION_RELATION,
      );

      expect(repoMock.save).not.toHaveBeenCalled();
    });

    it('ouvre une nouvelle obligation si aucune n’est ouverte', async () => {
      repoMock.findOne.mockResolvedValue(null);

      await service.ouvrirPourProspect(
        'prospect-1',
        TypeObligation.VALIDATION_RELATION,
      );

      expect(repoMock.save).toHaveBeenCalledWith(
        expect.objectContaining({
          prospect: { id: 'prospect-1' },
          type: TypeObligation.VALIDATION_RELATION,
        }),
      );
    });
  });

  // ------------------------------------------------- cloturerPourProspect
  describe('cloturerPourProspect', () => {
    it('ne fait rien si aucune obligation ouverte du type demandé', async () => {
      repoMock.findOne.mockResolvedValue(null);

      await service.cloturerPourProspect(
        'prospect-1',
        TypeObligation.VALIDATION_RELATION,
      );

      expect(repoMock.save).not.toHaveBeenCalled();
    });

    it("marque l'obligation ouverte comme FAIT", async () => {
      const ouverte = {
        id: 'obl-1',
        statut: StatutObligation.A_FAIRE,
        completedAt: null,
      };
      repoMock.findOne.mockResolvedValue(ouverte);

      await service.cloturerPourProspect(
        'prospect-1',
        TypeObligation.VALIDATION_RELATION,
      );

      expect(repoMock.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'obl-1',
          statut: StatutObligation.FAIT,
        }),
      );
    });
  });
});

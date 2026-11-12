import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ObligationsService } from './obligations.service';
import { Obligation } from './entities/obligation.entity';
import { Document } from '../documents/entities/document.entity';
import { Client } from '../clients/entities/client.entity';
import { BeneficiaireEffectif } from '../beneficiaires/entities/beneficiaire-effectif.entity';
import { ScoreRisque } from '../scoring/entities/score-risque.entity';
import {
  QuestionnaireAcceptation,
  StatutQuestionnaire,
} from '../questionnaires/entities/questionnaire-acceptation.entity';
import { NotificationsService } from '../notifications/notifications.service';
import {
  Role,
  StatutKyc,
  StatutObligation,
  TypeEntite,
  TypeObligation,
} from '../common/enums';

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
  const clientRepoMock = { findOneBy: jest.fn(), update: jest.fn() };
  const questionnaireRepoMock = { findOne: jest.fn().mockResolvedValue(null) };
  const notificationsMock = { creerPour: jest.fn(), creerPourRoles: jest.fn() };

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
        {
          provide: getRepositoryToken(QuestionnaireAcceptation),
          useValue: questionnaireRepoMock,
        },
        { provide: NotificationsService, useValue: notificationsMock },
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

  // ---------------------------------------------------------- revue annuelle
  describe('revue annuelle', () => {
    const ilYA = (jours: number) => {
      const d = new Date();
      d.setDate(d.getDate() - jours);
      return d;
    };
    const client = (override = {}) => ({
      id: 'c-1',
      typeEntite: TypeEntite.PERSONNE_PHYSIQUE,
      ppe: false,
      kycStatut: StatutKyc.VALIDE,
      kycCompletedAt: ilYA(10),
      ...override,
    });

    beforeEach(() => {
      documentRepoMock.find.mockResolvedValue([
        { type: 'PIECE_IDENTITE' },
        { type: 'JUSTIFICATIF_DOMICILE' },
      ]);
      repoMock.findOne.mockResolvedValue(null);
    });

    it('n’ouvre rien pour un KYC validé récemment', async () => {
      clientRepoMock.findOneBy.mockResolvedValue(client());
      await service.synchroniserPourClient('c-1');
      expect(repoMock.save).not.toHaveBeenCalled();
    });

    it('ouvre le rappel KYC 30 jours avant l’échéance annuelle', async () => {
      clientRepoMock.findOneBy.mockResolvedValue(
        client({ kycCompletedAt: ilYA(350) }),
      );
      await service.synchroniserPourClient('c-1');
      expect(repoMock.save).toHaveBeenCalledWith(
        expect.objectContaining({ type: TypeObligation.KYC_VERIFICATION }),
      );
      expect(clientRepoMock.update).not.toHaveBeenCalled();
    });

    it('passe le KYC en EXPIRÉ après un an', async () => {
      clientRepoMock.findOneBy.mockResolvedValue(
        client({ kycCompletedAt: ilYA(370) }),
      );
      await service.synchroniserPourClient('c-1');
      expect(clientRepoMock.update).toHaveBeenCalledWith('c-1', {
        kycStatut: StatutKyc.EXPIRE,
      });
    });

    it('rappelle le questionnaire LAB à refaire chaque année', async () => {
      clientRepoMock.findOneBy.mockResolvedValue(client());
      questionnaireRepoMock.findOne.mockResolvedValueOnce({
        statut: StatutQuestionnaire.VALIDE,
        validatedAt: ilYA(340),
      });
      await service.synchroniserPourClient('c-1');
      expect(repoMock.save).toHaveBeenCalledWith(
        expect.objectContaining({ type: TypeObligation.EVALUATION_RISQUE }),
      );
    });
  });

  describe('marquerEnRetard', () => {
    it('passe en retard et prévient le collaborateur, les responsables et les EC', async () => {
      repoMock.find.mockResolvedValue([
        {
          id: 'o-1',
          statut: StatutObligation.A_FAIRE,
          prospect: { id: 'p-1', nom: 'Martin', assignedTo: { id: 'u-1' } },
          client: null,
        },
      ]);
      await service.marquerEnRetard();
      expect(repoMock.save).toHaveBeenCalledWith(
        expect.objectContaining({ statut: StatutObligation.EN_RETARD }),
      );
      expect(notificationsMock.creerPour).toHaveBeenCalledWith(
        ['u-1'],
        'Obligation en retard',
        'Martin',
        '/dashboard/prospects/p-1',
      );
      expect(notificationsMock.creerPourRoles).toHaveBeenCalledWith(
        [Role.RESPONSABLE, Role.EXPERT_COMPTABLE],
        'Obligation en retard',
        'Martin',
        '/dashboard/prospects/p-1',
      );
    });
  });
});

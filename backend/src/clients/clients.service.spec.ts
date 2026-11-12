import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ClientsService } from './clients.service';
import { Client } from './entities/client.entity';
import { AuditLog } from '../audit/entities/audit-log.entity';
import { BeneficiaireEffectif } from '../beneficiaires/entities/beneficiaire-effectif.entity';
import { ScoringService } from '../scoring/scoring.service';
import { ObligationsService } from '../obligations/obligations.service';
import { LettresMissionService } from '../lettres-mission/lettres-mission.service';
import {
  Role,
  ScreeningStatut,
  StatutClient,
  StatutKyc,
  TypeDocument,
  TypeEntite,
} from '../common/enums';

const ADMIN = { id: 'admin-1', role: Role.ADMIN };

const client = (override: Partial<Client> = {}) =>
  ({
    id: 'c-1',
    raisonSociale: 'Société Martin',
    typeEntite: TypeEntite.PERSONNE_MORALE,
    statut: StatutClient.ACTIF,
    screeningStatut: ScreeningStatut.OK,
    kycStatut: StatutKyc.INCOMPLET,
    dateFinRelation: null,
    ppe: false,
    ...override,
  }) as Client;

describe('ClientsService', () => {
  let service: ClientsService;

  const clientsRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    save: jest.fn((c) => Promise.resolve(c)),
    softDelete: jest.fn(),
  };
  const auditRepo = { save: jest.fn(), create: jest.fn((d) => d) };
  const beneficiaireRepo = { count: jest.fn().mockResolvedValue(1) };
  const scoringService = { recalculateForClient: jest.fn() };
  const obligationsService = {
    synchroniserPourClient: jest.fn(),
    piecesManquantes: jest.fn().mockResolvedValue([]),
  };
  const lettresMissionService = { apresModificationDossier: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    beneficiaireRepo.count.mockResolvedValue(1);
    obligationsService.piecesManquantes.mockResolvedValue([]);
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClientsService,
        { provide: getRepositoryToken(Client), useValue: clientsRepo },
        { provide: getRepositoryToken(AuditLog), useValue: auditRepo },
        {
          provide: getRepositoryToken(BeneficiaireEffectif),
          useValue: beneficiaireRepo,
        },
        { provide: ScoringService, useValue: scoringService },
        { provide: ObligationsService, useValue: obligationsService },
        { provide: LettresMissionService, useValue: lettresMissionService },
      ],
    }).compile();
    service = module.get(ClientsService);
  });

  it('liste tous les clients, quel que soit le rôle', async () => {
    clientsRepo.find.mockResolvedValue([client()]);
    await service.findAll();
    expect(clientsRepo.find).toHaveBeenCalledWith(
      expect.not.objectContaining({ where: expect.anything() }),
    );
  });

  describe('update', () => {
    it('met à jour, recalcule le score et rafraîchit les lettres non signées', async () => {
      clientsRepo.findOneBy.mockResolvedValue(client());
      await service.update('c-1', { notes: 'x' }, ADMIN);
      expect(scoringService.recalculateForClient).toHaveBeenCalledWith(
        'c-1',
        ADMIN.id,
      );
      expect(
        lettresMissionService.apresModificationDossier,
      ).toHaveBeenCalledWith({ clientId: 'c-1' });
    });

    it('refuse toute modification d’un client résilié', async () => {
      clientsRepo.findOneBy.mockResolvedValue(
        client({ statut: StatutClient.RESILIE }),
      );
      await expect(
        service.update('c-1', { notes: 'x' }, ADMIN),
      ).rejects.toThrow(BadRequestException);
    });

    it('lève NotFoundException si le client est introuvable', async () => {
      clientsRepo.findOneBy.mockResolvedValue(null);
      await expect(service.update('x', {}, ADMIN)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('validation KYC', () => {
    it('liste les conditions non remplies', async () => {
      clientsRepo.findOneBy.mockResolvedValue(
        client({ screeningStatut: ScreeningStatut.NON_EFFECTUE }),
      );
      obligationsService.piecesManquantes.mockResolvedValue([
        TypeDocument.KBIS,
      ]);
      beneficiaireRepo.count.mockResolvedValue(0);

      const manquants = await service.conditionsKyc('c-1');

      expect(manquants).toEqual([
        'Pièces manquantes ou expirées : Kbis',
        'Le screening (listes de sanctions) n’a pas été effectué',
        'Aucun bénéficiaire effectif saisi',
      ]);
    });

    it('refuse de valider tant qu’une condition manque', async () => {
      clientsRepo.findOneBy.mockResolvedValue(
        client({ screeningStatut: ScreeningStatut.NON_EFFECTUE }),
      );
      await expect(service.validate('c-1', ADMIN)).rejects.toThrow(
        BadRequestException,
      );
      expect(clientsRepo.save).not.toHaveBeenCalled();
    });

    it('valide quand tout est complet', async () => {
      clientsRepo.findOneBy.mockResolvedValue(client());
      const c = await service.validate('c-1', ADMIN);
      expect(c.kycStatut).toBe(StatutKyc.VALIDE);
      expect(c.kycCompletedAt).toBeInstanceOf(Date);
    });
  });

  describe('statut et conservation', () => {
    it('date la fin de relation à la résiliation', async () => {
      clientsRepo.findOneBy.mockResolvedValue(client());
      const c = await service.changerStatut('c-1', StatutClient.RESILIE, ADMIN);
      expect(c.dateFinRelation).toBeInstanceOf(Date);
    });

    it('ne réactive pas un client résilié', async () => {
      clientsRepo.findOneBy.mockResolvedValue(
        client({ statut: StatutClient.RESILIE }),
      );
      await expect(
        service.changerStatut('c-1', StatutClient.ACTIF, ADMIN),
      ).rejects.toThrow(BadRequestException);
    });

    it('interdit l’archivage d’un client résilié depuis moins de 5 ans', async () => {
      clientsRepo.findOneBy.mockResolvedValue(
        client({ statut: StatutClient.RESILIE, dateFinRelation: new Date() }),
      );
      await expect(service.remove('c-1', ADMIN)).rejects.toThrow(
        ConflictException,
      );
      expect(clientsRepo.softDelete).not.toHaveBeenCalled();
    });

    it('autorise l’archivage après 5 ans', async () => {
      const ancienne = new Date();
      ancienne.setFullYear(ancienne.getFullYear() - 6);
      clientsRepo.findOneBy.mockResolvedValue(
        client({ statut: StatutClient.RESILIE, dateFinRelation: ancienne }),
      );
      await service.remove('c-1', ADMIN);
      expect(clientsRepo.softDelete).toHaveBeenCalledWith('c-1');
    });
  });
});

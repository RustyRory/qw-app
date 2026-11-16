import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ScreeningService } from './screening.service';
import { RegistreGelsService, compacter } from './registre-gels.service';
import {
  ScreeningCorrespondance,
  StatutCorrespondance,
} from './entities/screening-correspondance.entity';
import { Client } from '../clients/entities/client.entity';
import { Prospect } from '../prospects/entities/prospect.entity';
import { BeneficiaireEffectif } from '../beneficiaires/entities/beneficiaire-effectif.entity';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ScoringService } from '../scoring/scoring.service';
import { ScreeningStatut, TypeEntite } from '../common/enums';

const registre = compacter({
  Publications: {
    DatePublication: '2026-11-16T10:00:00+01:00',
    PublicationDetail: [
      {
        IdRegistre: 10,
        Nature: 'Personne physique',
        Nom: 'IVANOV',
        RegistreDetail: [
          { TypeChamp: 'PRENOM', Valeur: [{ Prenom: 'Ivan' }] },
          { TypeChamp: 'MOTIFS', Valeur: [{ Motifs: 'Sanctions' }] },
        ],
      },
      {
        IdRegistre: 11,
        Nature: 'Navire',
        Nom: 'Ivan Ivanov',
        RegistreDetail: [],
      },
    ],
  },
});

describe('ScreeningService', () => {
  let service: ScreeningService;
  const repo = {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn((x) => Promise.resolve(x)),
    create: jest.fn((x) => x),
    exist: jest.fn(),
  };
  const prospectRepo = {
    findOneBy: jest.fn(),
    findOne: jest.fn().mockResolvedValue({ screeningStatut: 'NON_EFFECTUE' }),
    update: jest.fn(),
    find: jest.fn(),
  };
  const uboRepo = { find: jest.fn() };
  const notifications = { creerPourRoles: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScreeningService,
        {
          provide: getRepositoryToken(ScreeningCorrespondance),
          useValue: repo,
        },
        {
          provide: getRepositoryToken(Client),
          useValue: { findOneBy: jest.fn() },
        },
        { provide: getRepositoryToken(Prospect), useValue: prospectRepo },
        {
          provide: getRepositoryToken(BeneficiaireEffectif),
          useValue: uboRepo,
        },
        {
          provide: RegistreGelsService,
          useValue: { obtenirAJour: jest.fn().mockResolvedValue(registre) },
        },
        { provide: AuditService, useValue: { log: jest.fn() } },
        { provide: NotificationsService, useValue: notifications },
        {
          provide: ScoringService,
          useValue: { recalculateForProspect: jest.fn() },
        },
      ],
    }).compile();
    service = module.get(ScreeningService);
  });

  it('ne garde que personnes physiques et morales du registre', () => {
    expect(registre.entrees.map((e) => e.id)).toEqual([10]);
    expect(registre.entrees[0].variantes).toContainEqual(['ivan', 'ivanov']);
  });

  it('signale le représentant légal présent au registre et met le dossier en alerte', async () => {
    prospectRepo.findOneBy.mockResolvedValue({
      id: 'p-1',
      nom: 'Alpha',
      typeEntite: TypeEntite.PERSONNE_MORALE,
      representantLegal: 'Ivanov Ivan',
    });
    uboRepo.find.mockResolvedValue([]);
    repo.find.mockResolvedValue([]);
    repo.exist.mockResolvedValue(true);

    await service.controler('prospect', 'p-1', 'u-1');

    expect(repo.save).toHaveBeenCalledWith([
      expect.objectContaining({
        personneControlee: 'Représentant légal : Ivanov Ivan',
        idRegistre: 10,
      }),
    ]);
    expect(notifications.creerPourRoles).toHaveBeenCalled();
    expect(prospectRepo.update).toHaveBeenCalledWith(
      'p-1',
      expect.objectContaining({ screeningStatut: ScreeningStatut.ALERTE }),
    );
  });

  it('ne recrée pas une correspondance déjà enregistrée', async () => {
    prospectRepo.findOneBy.mockResolvedValue({
      id: 'p-1',
      nom: 'Alpha',
      typeEntite: TypeEntite.PERSONNE_MORALE,
      representantLegal: 'Ivanov Ivan',
    });
    uboRepo.find.mockResolvedValue([]);
    repo.find.mockResolvedValue([
      {
        personneControlee: 'Représentant légal : Ivanov Ivan',
        idRegistre: 10,
      },
    ]);
    repo.exist.mockResolvedValue(false);

    await service.controler('prospect', 'p-1', 'u-1');

    expect(repo.save).not.toHaveBeenCalled();
    expect(prospectRepo.update).toHaveBeenCalledWith(
      'p-1',
      expect.objectContaining({ screeningStatut: ScreeningStatut.OK }),
    );
  });

  it('exige un commentaire pour trancher une correspondance', async () => {
    await expect(
      service.decider('c-1', StatutCorrespondance.HOMONYME, ' ', 'u-1'),
    ).rejects.toThrow(BadRequestException);
  });
});

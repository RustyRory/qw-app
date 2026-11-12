import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as fs from 'fs';
import { LettresMissionService } from './lettres-mission.service';
import { LettreMission } from './entities/lettre-mission.entity';
import { Mission } from '../missions/entities/mission.entity';
import { Prospect } from '../prospects/entities/prospect.entity';
import { AuditService } from '../audit/audit.service';
import { ObligationsService } from '../obligations/obligations.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CabinetService, CABINET_PAR_DEFAUT } from '../cabinet/cabinet.service';
import { DocumentsService } from '../documents/documents.service';
import { Role, StatutKanban, TypeMission } from '../common/enums';
import { buildLettreMissionContenu } from './lettre-mission-data.util';
import { ParametresCabinet } from '../cabinet/cabinet.entity';

jest.mock('fs');
jest.mock('puppeteer', () => ({
  __esModule: true,
  default: {
    launch: jest.fn().mockResolvedValue({
      newPage: jest.fn().mockResolvedValue({
        setContent: jest.fn().mockResolvedValue(undefined),
        pdf: jest.fn().mockResolvedValue(Buffer.from('pdf')),
      }),
      close: jest.fn().mockResolvedValue(undefined),
    }),
  },
}));

const EC = { id: 'ec-1', role: Role.EXPERT_COMPTABLE };

const prospect = () =>
  ({
    id: 'p-1',
    ref: 'QWP-2026-001',
    nom: 'Société Martin',
    statutKanban: StatutKanban.LM_A_FAIRE,
  }) as Prospect;

const mission = (override: Partial<Mission> = {}) =>
  ({
    id: 'm-1',
    type: TypeMission.COMPTES_ANNUELS,
    dateDebut: new Date('2026-01-01'),
    dateFin: null,
    honoraires: 1200,
    description: null,
    repartitionTravaux: null,
    client: null,
    prospect: prospect(),
    ...override,
  }) as unknown as Mission;

const lettre = (override: Partial<LettreMission> = {}) =>
  ({
    id: 'l-1',
    version: 1,
    contenu: buildLettreMissionContenu(
      mission(),
      CABINET_PAR_DEFAUT as ParametresCabinet,
    ),
    valideeParResponsable: false,
    signeeParExpert: false,
    signeeParClientAt: null,
    cheminStockage: '/tmp/l-1.pdf',
    cheminRelatif: null,
    signataire: null,
    mission: mission(),
    ...override,
  }) as unknown as LettreMission;

describe('LettresMissionService', () => {
  let service: LettresMissionService;

  const repoMock = {
    findOne: jest.fn(),
    find: jest.fn(),
    save: jest.fn((l) => Promise.resolve(l)),
    create: jest.fn((l) => l),
    remove: jest.fn(),
    manager: { findOneByOrFail: jest.fn() },
  };
  const missionRepoMock = { findOne: jest.fn(), find: jest.fn() };
  const prospectRepoMock = { save: jest.fn() };
  const auditServiceMock = { log: jest.fn() };
  const obligationsServiceMock = {
    ouvrirPourProspect: jest.fn(),
    cloturerPourProspect: jest.fn(),
  };
  const notificationsServiceMock = { creerPourRoles: jest.fn() };
  const cabinetServiceMock = {
    get: jest.fn().mockResolvedValue(CABINET_PAR_DEFAUT),
  };
  const documentsServiceMock = { upload: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LettresMissionService,
        { provide: getRepositoryToken(LettreMission), useValue: repoMock },
        { provide: getRepositoryToken(Mission), useValue: missionRepoMock },
        { provide: getRepositoryToken(Prospect), useValue: prospectRepoMock },
        { provide: AuditService, useValue: auditServiceMock },
        { provide: ObligationsService, useValue: obligationsServiceMock },
        { provide: NotificationsService, useValue: notificationsServiceMock },
        { provide: CabinetService, useValue: cabinetServiceMock },
        { provide: DocumentsService, useValue: documentsServiceMock },
      ],
    }).compile();
    service = module.get(LettresMissionService);
  });

  describe('genererVersion', () => {
    it('crée la v1 avec les coordonnées du cabinet et demande la validation', async () => {
      missionRepoMock.findOne.mockResolvedValue(mission());
      repoMock.findOne.mockResolvedValue(null);

      const l = await service.genererVersion('m-1');

      expect(l.version).toBe(1);
      expect((l.contenu as { cabinet: { nom: string } }).cabinet.nom).toBe(
        'QW CONSEILS',
      );
      expect(fs.writeFileSync).toHaveBeenCalled();
      expect(notificationsServiceMock.creerPourRoles).toHaveBeenCalledWith(
        [Role.RESPONSABLE, Role.EXPERT_COMPTABLE],
        'Lettre de mission à valider',
        'Société Martin',
        '/dashboard/prospects/p-1',
      );
    });
  });

  describe('apresModificationMission', () => {
    it('régénère une version non signée et annule sa validation', async () => {
      repoMock.findOne.mockResolvedValue(
        lettre({ valideeParResponsable: true }),
      );
      missionRepoMock.findOne.mockResolvedValue(mission());

      await service.apresModificationMission('m-1');

      const sauvee = repoMock.save.mock.calls[0][0] as LettreMission;
      expect(sauvee.version).toBe(1);
      expect(sauvee.valideeParResponsable).toBe(false);
      expect(repoMock.create).not.toHaveBeenCalled();
    });

    it('crée un avenant (v2) quand la dernière version est signée', async () => {
      repoMock.findOne.mockResolvedValue(lettre({ signeeParExpert: true }));
      missionRepoMock.findOne.mockResolvedValue(mission());

      await service.apresModificationMission('m-1');

      expect(repoMock.create).toHaveBeenCalledWith(
        expect.objectContaining({ version: 2 }),
      );
    });
  });

  describe('valider', () => {
    it('refuse une lettre déjà validée', async () => {
      repoMock.findOne.mockResolvedValue(
        lettre({ valideeParResponsable: true }),
      );
      await expect(service.valider('l-1', 'u')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('signer', () => {
    it("refuse de signer une lettre qui n'est pas validée", async () => {
      repoMock.findOne.mockResolvedValue(lettre());
      await expect(service.signer('l-1', EC.id)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('signe, nomme le PDF pour le dossier local et fait avancer le prospect', async () => {
      const l = lettre({ valideeParResponsable: true });
      repoMock.findOne.mockResolvedValue(l);
      repoMock.manager.findOneByOrFail.mockResolvedValue({
        id: EC.id,
        prenom: 'Anne',
        nom: 'Expert',
        signatureDataUri: null,
      });

      await service.signer('l-1', EC.id);

      expect(l.signeeParExpert).toBe(true);
      expect(l.cheminRelatif).toMatch(
        /^Prospects\/QWP-2026-001 Société Martin\/SocieteMartin-LettreMission-ComptesAnnuels-\d{2}-\d{2}-\d{4}\.pdf$/,
      );
      expect(prospectRepoMock.save).toHaveBeenCalledWith(
        expect.objectContaining({ statutKanban: StatutKanban.LM_ENVOYEE }),
      );
    });
  });

  describe('enregistrerSignatureClient', () => {
    const pdf = {
      originalname: 'signee.pdf',
      mimetype: 'application/pdf',
      size: 10,
      buffer: Buffer.from('pdf'),
    };

    it("exige la signature préalable de l'expert-comptable", async () => {
      repoMock.findOne.mockResolvedValue(lettre());
      await expect(
        service.enregistrerSignatureClient('l-1', pdf, EC),
      ).rejects.toThrow(BadRequestException);
      expect(documentsServiceMock.upload).not.toHaveBeenCalled();
    });

    it('dépose le PDF comme document du dossier et date la signature client', async () => {
      const l = lettre({ signeeParExpert: true });
      repoMock.findOne.mockResolvedValue(l);
      documentsServiceMock.upload.mockResolvedValue({ id: 'doc-1' });

      await service.enregistrerSignatureClient('l-1', pdf, EC);

      expect(documentsServiceMock.upload).toHaveBeenCalledWith(
        'prospect',
        'p-1',
        pdf,
        EC,
        expect.objectContaining({ missionId: 'm-1' }),
        { libelleType: 'LettreMissionSigneeClient-ComptesAnnuels' },
      );
      expect(l.signeeParClientAt).toBeInstanceOf(Date);
      expect(l.documentSigneClient).toEqual({ id: 'doc-1' });
    });

    it('refuse un fichier qui n’est pas un PDF', async () => {
      repoMock.findOne.mockResolvedValue(lettre({ signeeParExpert: true }));
      await expect(
        service.enregistrerSignatureClient(
          'l-1',
          { ...pdf, originalname: 'photo.jpg' },
          EC,
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('removeByMission', () => {
    it('interdit la suppression si une version est signée', async () => {
      repoMock.find.mockResolvedValue([lettre({ signeeParExpert: true })]);
      await expect(service.removeByMission('m-1')).rejects.toThrow(
        BadRequestException,
      );
      expect(repoMock.remove).not.toHaveBeenCalled();
    });

    it('supprime les versions non signées et leurs fichiers', async () => {
      const lettres = [lettre()];
      repoMock.find.mockResolvedValue(lettres);
      await service.removeByMission('m-1');
      expect(fs.rmSync).toHaveBeenCalledWith('/tmp/l-1.pdf', { force: true });
      expect(repoMock.remove).toHaveBeenCalledWith(lettres);
    });
  });
});

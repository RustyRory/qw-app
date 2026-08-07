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

jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  writeFileSync: jest.fn(),
  mkdirSync: jest.fn(),
  readFileSync: jest.fn(() => {
    throw new Error('logo introuvable (attendu en test)');
  }),
  existsSync: jest.fn(() => true),
}));

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { LettresMissionService } from './lettres-mission.service';
import { LettreMission } from './entities/lettre-mission.entity';
import { Mission } from '../missions/entities/mission.entity';
import { Prospect } from '../prospects/entities/prospect.entity';
import { DocusignService } from '../docusign/docusign.service';
import { AuditService } from '../audit/audit.service';
import { PlanningService } from '../planning/planning.service';
import { ObligationsService } from '../obligations/obligations.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  Role,
  StatutKanban,
  TypeMission,
  TypeObligation,
} from '../common/enums';

describe('LettresMissionService', () => {
  let service: LettresMissionService;

  const repoMock = {
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    create: jest.fn((data) => data),
    save: jest.fn((entity) => Promise.resolve({ id: 'lm-1', ...entity })),
    find: jest.fn(),
  };
  const missionRepoMock = { findOne: jest.fn() };
  const prospectRepoMock = { save: jest.fn() };
  const docusignServiceMock = {};
  const auditServiceMock = { log: jest.fn() };
  const planningServiceMock = {};
  const obligationsServiceMock = {
    ouvrirPourProspect: jest.fn(),
    cloturerPourProspect: jest.fn(),
  };
  const notificationsServiceMock = {
    creerPour: jest.fn(),
    creerPourRoles: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LettresMissionService,
        { provide: getRepositoryToken(LettreMission), useValue: repoMock },
        { provide: getRepositoryToken(Mission), useValue: missionRepoMock },
        { provide: getRepositoryToken(Prospect), useValue: prospectRepoMock },
        { provide: DocusignService, useValue: docusignServiceMock },
        { provide: AuditService, useValue: auditServiceMock },
        { provide: PlanningService, useValue: planningServiceMock },
        { provide: ObligationsService, useValue: obligationsServiceMock },
        { provide: NotificationsService, useValue: notificationsServiceMock },
      ],
    }).compile();

    service = module.get<LettresMissionService>(LettresMissionService);
  });

  describe('generateForMission', () => {
    it('ferme "LM à faire" et ouvre "LM à valider" pour une mission prospect', async () => {
      missionRepoMock.findOne.mockResolvedValue({
        id: 'mission-1',
        type: TypeMission.COMPTABILITE,
        description: 'Tenue comptable',
        dateDebut: new Date('2026-01-01'),
        dateFin: null,
        honoraires: null,
        client: null,
        prospect: { id: 'prospect-1', nom: 'ACME' },
        repartitionTravaux: [],
      });

      await service.generateForMission('mission-1');

      expect(obligationsServiceMock.cloturerPourProspect).toHaveBeenCalledWith(
        'prospect-1',
        TypeObligation.LETTRE_MISSION,
      );
      expect(obligationsServiceMock.ouvrirPourProspect).toHaveBeenCalledWith(
        'prospect-1',
        TypeObligation.VALIDATION_LETTRE_MISSION,
      );
      expect(notificationsServiceMock.creerPourRoles).toHaveBeenCalledWith(
        [Role.RESPONSABLE, Role.EXPERT_COMPTABLE],
        'Lettre de mission à valider',
        'ACME',
        '/dashboard/prospects/prospect-1',
      );
    });

    it("n'appelle pas ObligationsService pour une mission déjà rattachée à un client", async () => {
      missionRepoMock.findOne.mockResolvedValue({
        id: 'mission-2',
        type: TypeMission.COMPTABILITE,
        description: 'Tenue comptable',
        dateDebut: new Date('2026-01-01'),
        dateFin: null,
        honoraires: null,
        client: { id: 'client-1', raisonSociale: 'ACME' },
        prospect: null,
        repartitionTravaux: [],
      });

      await service.generateForMission('mission-2');

      expect(
        obligationsServiceMock.cloturerPourProspect,
      ).not.toHaveBeenCalled();
      expect(obligationsServiceMock.ouvrirPourProspect).not.toHaveBeenCalled();
    });
  });

  describe('validerParResponsable', () => {
    it('ferme "LM à valider" et ouvre "LM à signer" pour une mission prospect', async () => {
      repoMock.findOne
        .mockResolvedValueOnce({
          id: 'lm-1',
          valideeParResponsable: false,
          mission: { prospect: { id: 'prospect-1', nom: 'ACME' } },
        })
        .mockResolvedValueOnce({ id: 'lm-1' });

      await service.validerParResponsable('lm-1', 'user-resp');

      expect(obligationsServiceMock.cloturerPourProspect).toHaveBeenCalledWith(
        'prospect-1',
        TypeObligation.VALIDATION_LETTRE_MISSION,
      );
      expect(obligationsServiceMock.ouvrirPourProspect).toHaveBeenCalledWith(
        'prospect-1',
        TypeObligation.SIGNATURE_LETTRE_MISSION,
      );
      expect(notificationsServiceMock.creerPourRoles).toHaveBeenCalledWith(
        [Role.EXPERT_COMPTABLE],
        'Lettre de mission à signer',
        'ACME',
        '/dashboard/prospects/prospect-1',
      );
    });
  });

  describe('signer', () => {
    it('ferme "LM à signer" et fait avancer le kanban pour une mission prospect', async () => {
      const prospect = {
        id: 'prospect-1',
        nom: 'ACME',
        statutKanban: StatutKanban.LM_A_FAIRE,
      };
      repoMock.findOne
        .mockResolvedValueOnce({
          id: 'lm-1',
          valideeParResponsable: true,
          signeeParExpert: false,
          contenu: {},
          cheminStockage: null,
          mission: { prospect },
        })
        .mockResolvedValueOnce({ id: 'lm-1', signataire: null }) // regeneratePdf
        .mockResolvedValueOnce({ id: 'lm-1' }); // this.findOne(saved.id)

      await service.signer('lm-1', 'user-expert');

      expect(prospectRepoMock.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'prospect-1',
          statutKanban: StatutKanban.LM_ENVOYEE,
        }),
      );
      expect(obligationsServiceMock.cloturerPourProspect).toHaveBeenCalledWith(
        'prospect-1',
        TypeObligation.SIGNATURE_LETTRE_MISSION,
      );
      expect(notificationsServiceMock.creerPourRoles).toHaveBeenCalledWith(
        [Role.EXPERT_COMPTABLE],
        'Prospect prêt à être converti en client',
        'ACME',
        '/dashboard/prospects/prospect-1',
      );
    });
  });
});

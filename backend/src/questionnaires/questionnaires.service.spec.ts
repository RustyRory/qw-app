import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { QuestionnairesService } from './questionnaires.service';
import {
  QuestionnaireAcceptation,
  StatutQuestionnaire,
} from './entities/questionnaire-acceptation.entity';
import { Prospect } from '../prospects/entities/prospect.entity';
import { ScoringService } from '../scoring/scoring.service';
import { AuditService } from '../audit/audit.service';
import { PlanningService } from '../planning/planning.service';
import { ObligationsService } from '../obligations/obligations.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  NiveauRisque,
  Role,
  StatutKanban,
  TypeObligation,
} from '../common/enums';
import { ForbiddenException } from '@nestjs/common';

const ETAPE_QUESTIONNAIRE_A_REMPLIR = 'Questionnaire à remplir';

describe('QuestionnairesService', () => {
  let service: QuestionnairesService;

  const repoMock = {
    findOne: jest.fn(),
    create: jest.fn((data) => data),
    save: jest.fn((entity) => Promise.resolve({ id: 'q-1', ...entity })),
  };
  const prospectRepoMock = {
    save: jest.fn(),
    findOne: jest.fn().mockResolvedValue({
      id: 'prospect-1',
      nom: 'ACME',
      assignedTo: { id: 'user-collab' },
      createdBy: { id: 'user-createur' },
    }),
  };
  const scoringServiceMock = {
    recalculateForProspect: jest.fn(),
    findCurrentByProspect: jest.fn().mockResolvedValue(null),
  };
  const auditServiceMock = { log: jest.fn() };
  const planningServiceMock = {
    ouvrirEtapePourProspect: jest.fn(),
    fermerEtapePourProspect: jest.fn(),
  };
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
    prospectRepoMock.findOne.mockResolvedValue({
      id: 'prospect-1',
      nom: 'ACME',
      assignedTo: { id: 'user-collab' },
      createdBy: { id: 'user-createur' },
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuestionnairesService,
        {
          provide: getRepositoryToken(QuestionnaireAcceptation),
          useValue: repoMock,
        },
        { provide: getRepositoryToken(Prospect), useValue: prospectRepoMock },
        { provide: ScoringService, useValue: scoringServiceMock },
        { provide: AuditService, useValue: auditServiceMock },
        { provide: PlanningService, useValue: planningServiceMock },
        { provide: ObligationsService, useValue: obligationsServiceMock },
        { provide: NotificationsService, useValue: notificationsServiceMock },
      ],
    }).compile();

    service = module.get<QuestionnairesService>(QuestionnairesService);
  });

  describe('create', () => {
    it('ouvre une étape planning et une obligation de validation pour le prospect', async () => {
      repoMock.findOne.mockResolvedValue(null); // pas de questionnaire existant

      await service.create({ prospectId: 'prospect-1' }, 'user-1');

      expect(planningServiceMock.ouvrirEtapePourProspect).toHaveBeenCalledWith(
        'prospect-1',
        ETAPE_QUESTIONNAIRE_A_REMPLIR,
      );
      expect(obligationsServiceMock.ouvrirPourProspect).toHaveBeenCalledWith(
        'prospect-1',
        TypeObligation.VALIDATION_RELATION,
      );
      expect(notificationsServiceMock.creerPour).toHaveBeenCalledWith(
        ['user-collab'],
        'Questionnaire à remplir',
        'ACME',
        expect.stringContaining('/questionnaire'),
      );
    });
  });

  describe('validate', () => {
    it('refuse au responsable de valider un dossier à risque ÉLEVÉ', async () => {
      repoMock.findOne.mockResolvedValue({
        id: 'q-1',
        statut: StatutQuestionnaire.EN_COURS,
        prospect: {
          id: 'prospect-1',
          statutKanban: StatutKanban.VALIDATION_LAB,
        },
      });
      scoringServiceMock.findCurrentByProspect.mockResolvedValueOnce({
        niveau: NiveauRisque.ELEVE,
      });

      await expect(
        service.validate('q-1', 'user-1', Role.RESPONSABLE),
      ).rejects.toThrow(ForbiddenException);
      expect(repoMock.save).not.toHaveBeenCalled();
    });

    it("laisse l'expert-comptable valider un dossier à risque ÉLEVÉ", async () => {
      repoMock.findOne.mockResolvedValue({
        id: 'q-1',
        statut: StatutQuestionnaire.EN_COURS,
        prospect: {
          id: 'prospect-1',
          statutKanban: StatutKanban.VALIDATION_LAB,
        },
      });
      scoringServiceMock.findCurrentByProspect.mockResolvedValueOnce({
        niveau: NiveauRisque.ELEVE,
      });

      await service.validate('q-1', 'user-1', Role.EXPERT_COMPTABLE);
      expect(repoMock.save).toHaveBeenCalled();
    });

    it('ferme les tâches de remplissage/validation et ouvre "LM à faire"', async () => {
      const prospect = {
        id: 'prospect-1',
        statutKanban: StatutKanban.VALIDATION_LAB,
      };
      repoMock.findOne.mockResolvedValue({
        id: 'q-1',
        statut: StatutQuestionnaire.EN_COURS,
        prospect,
      });

      await service.validate('q-1', 'user-1');

      expect(planningServiceMock.fermerEtapePourProspect).toHaveBeenCalledWith(
        'prospect-1',
        ETAPE_QUESTIONNAIRE_A_REMPLIR,
      );
      expect(obligationsServiceMock.cloturerPourProspect).toHaveBeenCalledWith(
        'prospect-1',
        TypeObligation.VALIDATION_RELATION,
      );
      expect(obligationsServiceMock.ouvrirPourProspect).toHaveBeenCalledWith(
        'prospect-1',
        TypeObligation.LETTRE_MISSION,
      );
      expect(notificationsServiceMock.creerPour).toHaveBeenCalledWith(
        ['user-collab'],
        'Lettre de mission à créer',
        'ACME',
        '/dashboard/prospects/prospect-1',
      );
    });
  });

  describe('refuse', () => {
    it('ferme les tâches de remplissage/validation sans ouvrir "LM à faire"', async () => {
      const prospect = {
        id: 'prospect-1',
        statutKanban: StatutKanban.VALIDATION_LAB,
      };
      repoMock.findOne.mockResolvedValue({
        id: 'q-1',
        statut: StatutQuestionnaire.EN_COURS,
        prospect,
      });

      await service.refuse('q-1', 'motif de refus', 'user-1');

      expect(planningServiceMock.fermerEtapePourProspect).toHaveBeenCalledWith(
        'prospect-1',
        ETAPE_QUESTIONNAIRE_A_REMPLIR,
      );
      expect(obligationsServiceMock.cloturerPourProspect).toHaveBeenCalledWith(
        'prospect-1',
        TypeObligation.VALIDATION_RELATION,
      );
      expect(obligationsServiceMock.ouvrirPourProspect).not.toHaveBeenCalled();
    });
  });

  describe('reopen', () => {
    it('rouvre l’étape de remplissage et l’obligation de validation', async () => {
      const prospect = {
        id: 'prospect-1',
        statutKanban: StatutKanban.VALIDATION_LAB,
      };
      repoMock.findOne.mockResolvedValue({
        id: 'q-1',
        statut: StatutQuestionnaire.VALIDE,
        prospect,
        validatedBy: null,
      });

      await service.reopen('q-1', 'user-1');

      expect(planningServiceMock.ouvrirEtapePourProspect).toHaveBeenCalledWith(
        'prospect-1',
        ETAPE_QUESTIONNAIRE_A_REMPLIR,
      );
      expect(obligationsServiceMock.ouvrirPourProspect).toHaveBeenCalledWith(
        'prospect-1',
        TypeObligation.VALIDATION_RELATION,
      );
    });
  });
});

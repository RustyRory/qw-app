import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AcceptationsService } from './acceptations.service';
import {
  AcceptationMission,
  StatutAcceptation,
} from './entities/acceptation-mission.entity';
import { CATALOGUE_ACCEPTATION, questionsSansReponse } from './catalogue';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ObligationsService } from '../obligations/obligations.service';

const toutOui = (maintien: boolean) =>
  Object.fromEntries(
    CATALOGUE_ACCEPTATION.filter((s) => maintien || !s.maintienSeulement)
      .flatMap((s) => s.questions)
      .map((q) => [q.id, { reponse: 'oui' as const }]),
  );

describe('AcceptationsService', () => {
  let service: AcceptationsService;
  const repo = {
    findOne: jest.fn(),
    save: jest.fn((a) => Promise.resolve(a)),
    create: jest.fn((a) => a),
  };
  const obligations = {
    synchroniserPourProspect: jest.fn(),
    synchroniserPourClient: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AcceptationsService,
        { provide: getRepositoryToken(AcceptationMission), useValue: repo },
        { provide: AuditService, useValue: { log: jest.fn() } },
        {
          provide: NotificationsService,
          useValue: { creerPourRoles: jest.fn() },
        },
        { provide: ObligationsService, useValue: obligations },
      ],
    }).compile();
    service = module.get(AcceptationsService);
  });

  it('la partie maintien n’est exigée que pour un client', () => {
    expect(questionsSansReponse(toutOui(false), false)).toEqual([]);
    expect(questionsSansReponse(toutOui(false), true)).toEqual([
      'evenements',
      'obligationsDeclaratives',
      'poursuite',
    ]);
  });

  it('ignore les questions inconnues et normalise les réponses', async () => {
    repo.findOne.mockResolvedValue(null);
    const a = await service.enregistrer(
      'prospect',
      'p-1',
      {
        visite: { reponse: 'oui', niveau: 'X' as never, observation: 'ok' },
        pirate: { reponse: 'oui' },
      },
      'u-1',
    );
    expect(a.reponses).toEqual({
      visite: { reponse: 'oui', niveau: null, observation: 'ok' },
    });
    expect(obligations.synchroniserPourProspect).toHaveBeenCalledWith('p-1');
  });

  it('refuse la décision tant que des questions sont sans réponse', async () => {
    repo.findOne.mockResolvedValue({
      id: 'a-1',
      statut: StatutAcceptation.EN_COURS,
      reponses: {},
      prospect: { id: 'p-1' },
      client: null,
    });
    await expect(service.accepter('a-1', 'ec')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('enregistre la décision de l’expert-comptable', async () => {
    repo.findOne.mockResolvedValue({
      id: 'a-1',
      statut: StatutAcceptation.EN_COURS,
      reponses: toutOui(false),
      prospect: { id: 'p-1' },
      client: null,
    });
    const a = await service.accepter('a-1', 'ec');
    expect(a.statut).toBe(StatutAcceptation.ACCEPTEE);
    expect(a.decideePar).toEqual({ id: 'ec' });
  });

  it('interdit de modifier une mission acceptée sans la rouvrir', async () => {
    repo.findOne.mockResolvedValue({ statut: StatutAcceptation.ACCEPTEE });
    await expect(
      service.enregistrer('client', 'c-1', {}, 'u-1'),
    ).rejects.toThrow(BadRequestException);
  });
});

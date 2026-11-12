import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { OperationsService } from './operations.service';
import { OperationSensible } from './entities/operation-sensible.entity';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import { Role, StatutOperationSensible } from '../common/enums';

const EC = { id: 'ec', role: Role.EXPERT_COMPTABLE };
const COLLAB = { id: 'collab', role: Role.COLLABORATEUR };

describe('OperationsService', () => {
  let service: OperationsService;
  const repo = {
    create: jest.fn((d) => d),
    save: jest.fn((d) => Promise.resolve({ id: 'op-1', ...d })),
    find: jest.fn(),
    findOneBy: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OperationsService,
        { provide: getRepositoryToken(OperationSensible), useValue: repo },
        { provide: AuditService, useValue: { log: jest.fn() } },
        {
          provide: NotificationsService,
          useValue: { creerPourRoles: jest.fn() },
        },
      ],
    }).compile();
    service = module.get(OperationsService);
  });

  it('un collaborateur ne voit que ses propres signalements', async () => {
    repo.find.mockResolvedValue([]);
    await service.findByClient('c-1', COLLAB);
    expect(repo.find).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { client: { id: 'c-1' }, signaleBy: { id: 'collab' } },
      }),
    );
  });

  it('exige la prise en analyse avant une décision', async () => {
    repo.findOneBy.mockResolvedValue({
      id: 'op-1',
      statut: StatutOperationSensible.SIGNALEE,
    });
    await expect(service.classer('op-1', 'RAS', EC)).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('exige un motif pour classer sans suite', async () => {
    await expect(service.classer('op-1', '  ', EC)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('classe une opération en analyse avec son motif', async () => {
    repo.findOneBy.mockResolvedValue({
      id: 'op-1',
      statut: StatutOperationSensible.EN_ANALYSE,
    });
    const o = await service.classer('op-1', 'Justificatifs fournis', EC);
    expect(o.statut).toBe(StatutOperationSensible.CLASSEE);
    expect(o.motifClassement).toBe('Justificatifs fournis');
  });

  it('refuse toute action sur une opération clôturée', async () => {
    repo.findOneBy.mockResolvedValue({
      id: 'op-1',
      statut: StatutOperationSensible.TRACFIN_DECLARE,
    });
    await expect(service.prendreEnAnalyse('op-1', EC)).rejects.toThrow(
      BadRequestException,
    );
  });
});

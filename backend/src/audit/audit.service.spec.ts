import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AuditService } from './audit.service';
import { AuditAction, AuditLog } from './entities/audit-log.entity';

const makeLog = (override: Partial<AuditLog> = {}): AuditLog =>
  ({
    id: 'log-1',
    action: AuditAction.UPDATE,
    ressource: 'Client',
    ressourceId: 'client-1',
    details: null,
    createdAt: new Date(),
    utilisateur: { id: 'user-1' },
    ...override,
  }) as AuditLog;

describe('AuditService', () => {
  let service: AuditService;

  const auditRepoMock = {
    find: jest.fn(),
    save: jest.fn(),
    create: jest.fn((data) => data),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditService,
        { provide: getRepositoryToken(AuditLog), useValue: auditRepoMock },
      ],
    }).compile();

    service = module.get<AuditService>(AuditService);
  });

  // ---------------------------------------------------------------------- log
  describe('log', () => {
    it('persiste un log avec les bons champs', async () => {
      auditRepoMock.save.mockResolvedValue(makeLog());

      await service.log('user-1', AuditAction.UPDATE, 'Client', 'client-1', {
        nom: 'Dupont',
      });

      expect(auditRepoMock.save).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.UPDATE,
          ressource: 'Client',
          ressourceId: 'client-1',
          details: { nom: 'Dupont' },
          utilisateur: { id: 'user-1' },
        }),
      );
    });

    it('utilise null comme details par défaut', async () => {
      auditRepoMock.save.mockResolvedValue(makeLog());

      await service.log('user-1', AuditAction.READ, 'Document', 'doc-1');

      expect(auditRepoMock.save).toHaveBeenCalledWith(
        expect.objectContaining({ details: null }),
      );
    });
  });

  // ----------------------------------------------------------------- findAll
  describe('findAll', () => {
    it('retourne tous les logs triés par date décroissante', async () => {
      const logs = [makeLog(), makeLog({ id: 'log-2' })];
      auditRepoMock.find.mockResolvedValue(logs);

      const result = await service.findAll();

      expect(result).toBe(logs);
      expect(auditRepoMock.find).toHaveBeenCalledWith({
        relations: ['utilisateur'],
        order: { createdAt: 'DESC' },
      });
    });
  });

  // ------------------------------------------------------------- findByEntite
  describe('findByEntite', () => {
    it('filtre par ressourceId et trie par date décroissante', async () => {
      const logs = [makeLog()];
      auditRepoMock.find.mockResolvedValue(logs);

      const result = await service.findByEntite('client-1');

      expect(result).toBe(logs);
      expect(auditRepoMock.find).toHaveBeenCalledWith({
        where: { ressourceId: 'client-1' },
        relations: ['utilisateur'],
        order: { createdAt: 'DESC' },
      });
    });
  });
});

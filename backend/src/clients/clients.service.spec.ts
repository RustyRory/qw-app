import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { ClientsService } from './clients.service';
import { Client } from './entities/client.entity';
import { AuditAction, AuditLog } from '../audit/entities/audit-log.entity';
import {
  Role,
  ScreeningStatut,
  StatutClient,
  StatutKyc,
  TypeEntite,
} from '../common/enums';
import { ScoringService } from '../scoring/scoring.service';

const COLLAB: { id: string; role: Role } = {
  id: 'user-1',
  role: Role.COLLABORATEUR,
};
const ADMIN: { id: string; role: Role } = {
  id: 'user-2',
  role: Role.ADMIN,
};

const makeClient = (override: Partial<Client> = {}): Client =>
  ({
    id: 'client-1',
    ref: 'QW-2026-001',
    raisonSociale: 'Alice Dupont',
    typeEntite: TypeEntite.PERSONNE_PHYSIQUE,
    statut: StatutClient.ACTIF,
    kycStatut: StatutKyc.INCOMPLET,
    createdBy: { id: COLLAB.id },
    ...override,
  }) as Client;

describe('ClientsService', () => {
  let service: ClientsService;

  const clientsRepoMock = {
    createQueryBuilder: jest.fn(),
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    save: jest.fn(),
    softDelete: jest.fn(),
    create: jest.fn((data) => data),
  };

  const auditRepoMock = {
    save: jest.fn(),
    create: jest.fn((data) => data),
  };

  const refQueryBuilderMock = {
    select: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    withDeleted: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    getRawOne: jest.fn(),
  };

  const managerMock = {
    create: jest.fn((_, data) => data),
    save: jest.fn(),
    createQueryBuilder: jest.fn().mockReturnValue(refQueryBuilderMock),
  };

  const dataSourceMock = {
    transaction: jest.fn((cb) => cb(managerMock)),
  };

  const scoringServiceMock = {
    recalculateForClient: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClientsService,
        { provide: getRepositoryToken(Client), useValue: clientsRepoMock },
        { provide: getRepositoryToken(AuditLog), useValue: auditRepoMock },
        { provide: DataSource, useValue: dataSourceMock },
        { provide: ScoringService, useValue: scoringServiceMock },
      ],
    }).compile();

    service = module.get<ClientsService>(ClientsService);
  });

  // ------------------------------------------------------------------ create
  describe('create', () => {
    const dto = {
      raisonSociale: 'Bob Martin',
      typeEntite: TypeEntite.PERSONNE_PHYSIQUE,
    };

    it('génère la référence QW-YYYY-XXX avec le bon séquençage', async () => {
      refQueryBuilderMock.getRawOne.mockResolvedValue({ ref: 'QW-2026-002' });
      managerMock.save.mockImplementation((entity) =>
        Promise.resolve({ ...entity, id: 'client-new' }),
      );

      await service.create(dto, COLLAB);

      const saved = managerMock.save.mock.calls[0][0] as Client;
      expect(saved.ref).toMatch(/^QW-\d{4}-003$/);
    });

    it("enregistre un audit CREATE avec l'id du créateur", async () => {
      refQueryBuilderMock.getRawOne.mockResolvedValue(null);
      managerMock.save
        .mockResolvedValueOnce({ id: 'client-new', ref: 'QW-2026-001' })
        .mockResolvedValue({});

      await service.create(dto, COLLAB);

      const auditSaved = managerMock.save.mock.calls[1][0] as Partial<AuditLog>;
      expect(auditSaved).toMatchObject({
        action: AuditAction.CREATE,
        ressource: 'Client',
        utilisateur: { id: COLLAB.id },
      });
    });

    it('déclenche le recalcul automatique du score après création', async () => {
      refQueryBuilderMock.getRawOne.mockResolvedValue(null);
      managerMock.save.mockResolvedValue({ id: 'client-new' });

      await service.create(dto, COLLAB);

      expect(scoringServiceMock.recalculateForClient).toHaveBeenCalledWith(
        'client-new',
        COLLAB.id,
      );
    });
  });

  // ---------------------------------------------------------------- findAll
  describe('findAll', () => {
    const makeQb = (result: Client[]) => ({
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue(result),
    });

    it('filtre par créateur pour un collaborateur', async () => {
      const qb = makeQb([makeClient()]);
      clientsRepoMock.createQueryBuilder.mockReturnValue(qb);

      await service.findAll(COLLAB);

      expect(qb.where).toHaveBeenCalledWith('createdBy.id = :id', {
        id: COLLAB.id,
      });
    });

    it('ne filtre pas pour un admin', async () => {
      const qb = makeQb([makeClient(), makeClient({ id: 'client-2' })]);
      clientsRepoMock.createQueryBuilder.mockReturnValue(qb);

      await service.findAll(ADMIN);

      expect(qb.where).not.toHaveBeenCalled();
    });
  });

  // --------------------------------------------------------------- findOne
  describe('findOne', () => {
    it('retourne le client avec ses relations', async () => {
      const client = makeClient();
      clientsRepoMock.findOne.mockResolvedValue(client);

      const result = await service.findOne('client-1');

      expect(result).toBe(client);
      expect(clientsRepoMock.findOne).toHaveBeenCalledWith({
        where: { id: 'client-1' },
        relations: expect.arrayContaining(['documents', 'scores']),
      });
    });

    it('lève NotFoundException si le client est introuvable', async () => {
      clientsRepoMock.findOne.mockResolvedValue(null);

      await expect(service.findOne('inexistant')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ---------------------------------------------------------------- update
  describe('update', () => {
    it('met à jour les champs et enregistre un audit UPDATE', async () => {
      const client = makeClient();
      clientsRepoMock.findOne.mockResolvedValue(client);
      clientsRepoMock.save.mockResolvedValue({
        ...client,
        raisonSociale: 'Nouveau',
      });

      await service.update('client-1', { raisonSociale: 'Nouveau' }, ADMIN);

      expect(clientsRepoMock.save).toHaveBeenCalledWith(
        expect.objectContaining({ raisonSociale: 'Nouveau' }),
      );
      expect(auditRepoMock.save).toHaveBeenCalledWith(
        expect.objectContaining({ action: AuditAction.UPDATE }),
      );
      expect(scoringServiceMock.recalculateForClient).toHaveBeenCalledWith(
        'client-1',
        ADMIN.id,
      );
    });
  });

  // ------------------------------------------------------- updateScreening
  describe('updateScreening', () => {
    it('enregistre le statut, la date et déclenche le recalcul du score', async () => {
      const client = makeClient();
      clientsRepoMock.findOneBy.mockResolvedValue(client);
      clientsRepoMock.save.mockResolvedValue({
        ...client,
        screeningStatut: ScreeningStatut.ALERTE,
      });

      await service.updateScreening(
        'client-1',
        { statut: ScreeningStatut.ALERTE },
        ADMIN,
      );

      expect(clientsRepoMock.save).toHaveBeenCalledWith(
        expect.objectContaining({
          screeningStatut: ScreeningStatut.ALERTE,
          screeningDate: expect.any(Date),
        }),
      );
      expect(auditRepoMock.save).toHaveBeenCalledWith(
        expect.objectContaining({ action: AuditAction.VALIDATE }),
      );
      expect(scoringServiceMock.recalculateForClient).toHaveBeenCalledWith(
        'client-1',
        ADMIN.id,
      );
    });

    it('lève NotFoundException si le client est introuvable', async () => {
      clientsRepoMock.findOneBy.mockResolvedValue(null);

      await expect(
        service.updateScreening(
          'inexistant',
          { statut: ScreeningStatut.OK },
          ADMIN,
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // -------------------------------------------------------------- validate
  describe('validate', () => {
    it('valide le KYC du dossier et enregistre un audit VALIDATE', async () => {
      const client = makeClient();
      clientsRepoMock.findOneBy.mockResolvedValue(client);
      clientsRepoMock.save.mockResolvedValue({
        ...client,
        kycStatut: StatutKyc.VALIDE,
      });

      await service.validate('client-1', ADMIN);

      expect(clientsRepoMock.save).toHaveBeenCalledWith(
        expect.objectContaining({ kycStatut: StatutKyc.VALIDE }),
      );
      expect(auditRepoMock.save).toHaveBeenCalledWith(
        expect.objectContaining({ action: AuditAction.VALIDATE }),
      );
    });

    it('lève NotFoundException si le client est introuvable', async () => {
      clientsRepoMock.findOneBy.mockResolvedValue(null);

      await expect(service.validate('inexistant', ADMIN)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ---------------------------------------------------------------- remove
  describe('remove', () => {
    it('soft-delete le client et enregistre un audit DELETE', async () => {
      clientsRepoMock.findOneBy.mockResolvedValue(makeClient());
      clientsRepoMock.softDelete.mockResolvedValue({});

      await service.remove('client-1', ADMIN);

      expect(clientsRepoMock.softDelete).toHaveBeenCalledWith('client-1');
      expect(auditRepoMock.save).toHaveBeenCalledWith(
        expect.objectContaining({ action: AuditAction.DELETE }),
      );
    });

    it('lève NotFoundException si le client est introuvable', async () => {
      clientsRepoMock.findOneBy.mockResolvedValue(null);

      await expect(service.remove('inexistant', ADMIN)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});

import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { KycService } from './kyc.service';
import { Kyc } from './entities/kyc.entity';
import { AuditAction, AuditLog } from '../audit/entities/audit-log.entity';
import { UserRole } from '../users/entities/user.entity';

const COLLAB: { id: string; role: UserRole } = {
  id: 'user-1',
  role: UserRole.COLLABORATEUR,
};

const makeKyc = (override: Partial<Kyc> = {}): Kyc =>
  ({
    id: 'kyc-1',
    nationalite: null,
    paysResidence: null,
    secteurActivite: null,
    formeJuridique: null,
    estPep: false,
    paysHautRisque: false,
    chiffreAffaires: null,
    client: { id: 'client-1' },
    ...override,
  }) as Kyc;

describe('KycService', () => {
  let service: KycService;

  const kycRepoMock = {
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn((data) => data),
  };

  const auditRepoMock = {
    save: jest.fn(),
    create: jest.fn((data) => data),
  };

  const redisMock = {
    get: jest.fn(),
    setex: jest.fn(),
    del: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KycService,
        { provide: getRepositoryToken(Kyc), useValue: kycRepoMock },
        { provide: getRepositoryToken(AuditLog), useValue: auditRepoMock },
        { provide: 'REDIS_CLIENT', useValue: redisMock },
      ],
    }).compile();

    service = module.get<KycService>(KycService);
  });

  // ----------------------------------------------------------- findByClient
  describe('findByClient', () => {
    it('retourne la fiche depuis le cache Redis si elle existe', async () => {
      const kyc = makeKyc();
      redisMock.get.mockResolvedValue(JSON.stringify(kyc));

      const result = await service.findByClient('client-1');

      expect(result).toEqual(kyc);
      expect(kycRepoMock.findOne).not.toHaveBeenCalled();
    });

    it('interroge la base et met en cache si le cache est vide', async () => {
      const kyc = makeKyc();
      redisMock.get.mockResolvedValue(null);
      kycRepoMock.findOne.mockResolvedValue(kyc);

      const result = await service.findByClient('client-1');

      expect(kycRepoMock.findOne).toHaveBeenCalledWith({
        where: { client: { id: 'client-1' } },
        relations: ['client'],
      });
      expect(redisMock.setex).toHaveBeenCalledWith(
        'kyc:client-1',
        300,
        JSON.stringify(kyc),
      );
      expect(result).toBe(kyc);
    });

    it('lève NotFoundException si la fiche KYC est introuvable', async () => {
      redisMock.get.mockResolvedValue(null);
      kycRepoMock.findOne.mockResolvedValue(null);

      await expect(service.findByClient('inexistant')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // --------------------------------------------------------------- update
  describe('update', () => {
    it('met à jour les champs et enregistre un audit UPDATE', async () => {
      const kyc = makeKyc();
      kycRepoMock.findOne.mockResolvedValue(kyc);
      kycRepoMock.save.mockResolvedValue({ ...kyc, nationalite: 'Française' });

      await service.update('client-1', { nationalite: 'Française' }, COLLAB);

      expect(kycRepoMock.save).toHaveBeenCalledWith(
        expect.objectContaining({ nationalite: 'Française' }),
      );
      expect(auditRepoMock.save).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.UPDATE,
          entiteType: 'Kyc',
          entiteId: 'kyc-1',
          utilisateur: { id: COLLAB.id },
        }),
      );
    });

    it('invalide les clés kyc:{id} et client:{id} après la mise à jour', async () => {
      kycRepoMock.findOne.mockResolvedValue(makeKyc());
      kycRepoMock.save.mockResolvedValue(makeKyc());

      await service.update('client-1', { estPep: true }, COLLAB);

      expect(redisMock.del).toHaveBeenCalledWith(
        'kyc:client-1',
        'client:client-1',
      );
    });

    it('lève NotFoundException si la fiche KYC est introuvable', async () => {
      kycRepoMock.findOne.mockResolvedValue(null);

      await expect(
        service.update('inexistant', { estPep: true }, COLLAB),
      ).rejects.toThrow(NotFoundException);
    });
  });
});

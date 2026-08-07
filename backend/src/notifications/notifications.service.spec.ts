import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotificationsService } from './notifications.service';
import { Notification } from './entities/notification.entity';
import { User } from '../users/entities/user.entity';
import { Role } from '../common/enums';

describe('NotificationsService', () => {
  let service: NotificationsService;

  const repoMock = {
    create: jest.fn((data) => data),
    save: jest.fn((entity) => Promise.resolve(entity)),
    find: jest.fn(),
    count: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
  };
  const userRepoMock = { find: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: getRepositoryToken(Notification), useValue: repoMock },
        { provide: getRepositoryToken(User), useValue: userRepoMock },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
  });

  describe('creerPour', () => {
    it('ne fait rien si la liste de destinataires est vide', async () => {
      await service.creerPour([], 'Titre', null, null);
      expect(repoMock.save).not.toHaveBeenCalled();
    });

    it('crée une notification par destinataire (fan-out)', async () => {
      await service.creerPour(
        ['user-1', 'user-2'],
        'Questionnaire à remplir',
        'ACME',
        '/dashboard/prospects/prospect-1/questionnaire',
      );

      expect(repoMock.save).toHaveBeenCalledWith([
        expect.objectContaining({
          user: { id: 'user-1' },
          titre: 'Questionnaire à remplir',
        }),
        expect.objectContaining({
          user: { id: 'user-2' },
          titre: 'Questionnaire à remplir',
        }),
      ]);
    });
  });

  describe('creerPourRoles', () => {
    it('résout les utilisateurs actifs des rôles donnés puis notifie chacun', async () => {
      userRepoMock.find.mockResolvedValue([
        { id: 'user-resp' },
        { id: 'user-expert' },
      ]);

      await service.creerPourRoles(
        [Role.RESPONSABLE, Role.EXPERT_COMPTABLE],
        'Lettre de mission à valider',
        'ACME',
        '/dashboard/prospects/prospect-1',
      );

      expect(repoMock.save).toHaveBeenCalledWith([
        expect.objectContaining({ user: { id: 'user-resp' } }),
        expect.objectContaining({ user: { id: 'user-expert' } }),
      ]);
    });
  });

  describe('marquerLue', () => {
    it("lève une NotFoundException si la notification n'appartient pas à l'utilisateur", async () => {
      repoMock.findOne.mockResolvedValue(null);
      await expect(service.marquerLue('notif-1', 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('marque comme lue et ne resauvegarde pas si déjà lue', async () => {
      repoMock.findOne.mockResolvedValue({ id: 'notif-1', lu: true });
      await service.marquerLue('notif-1', 'user-1');
      expect(repoMock.save).not.toHaveBeenCalled();
    });

    it('marque comme lue une notification non lue', async () => {
      repoMock.findOne.mockResolvedValue({ id: 'notif-1', lu: false });
      await service.marquerLue('notif-1', 'user-1');
      expect(repoMock.save).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'notif-1', lu: true }),
      );
    });
  });

  describe('marquerToutesLues', () => {
    it('met à jour toutes les notifications non lues du user', async () => {
      await service.marquerToutesLues('user-1');
      expect(repoMock.update).toHaveBeenCalledWith(
        { user: { id: 'user-1' }, lu: false },
        expect.objectContaining({ lu: true }),
      );
    });
  });
});

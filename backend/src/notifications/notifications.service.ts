import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';
import { User } from '../users/entities/user.entity';
import { Role } from '../common/enums';

const NOMBRE_MAX_AFFICHE = 50;

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly repo: Repository<Notification>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  // Fan-out : une notification par destinataire, pour permettre un suivi
  // lu/non-lu indépendant par utilisateur.
  async creerPour(
    userIds: string[],
    titre: string,
    message: string | null,
    lien: string | null,
  ): Promise<void> {
    if (userIds.length === 0) return;

    await this.repo.save(
      userIds.map((userId) =>
        this.repo.create({
          user: { id: userId } as User,
          titre,
          message,
          lien,
        }),
      ),
    );
  }

  // Résout les utilisateurs actifs ayant un des rôles donnés, puis notifie
  // chacun d'eux — utilisé pour les étapes de validation/signature qui ne
  // sont pas assignées à une personne précise (ex. "LM à valider").
  async creerPourRoles(
    roles: Role[],
    titre: string,
    message: string | null,
    lien: string | null,
  ): Promise<void> {
    const users = await this.userRepo.find({
      where: { role: In(roles), isActive: true },
    });
    await this.creerPour(
      users.map((u) => u.id),
      titre,
      message,
      lien,
    );
  }

  findForUser(userId: string): Promise<Notification[]> {
    return this.repo.find({
      where: { user: { id: userId } },
      order: { createdAt: 'DESC' },
      take: NOMBRE_MAX_AFFICHE,
    });
  }

  countUnread(userId: string): Promise<number> {
    return this.repo.count({ where: { user: { id: userId }, lu: false } });
  }

  async marquerLue(id: string, userId: string): Promise<Notification> {
    const n = await this.repo.findOne({ where: { id, user: { id: userId } } });
    if (!n) throw new NotFoundException('Notification introuvable');
    if (!n.lu) {
      n.lu = true;
      n.luAt = new Date();
      await this.repo.save(n);
    }
    return n;
  }

  async marquerToutesLues(userId: string): Promise<void> {
    await this.repo.update(
      { user: { id: userId }, lu: false },
      { lu: true, luAt: new Date() },
    );
  }
}

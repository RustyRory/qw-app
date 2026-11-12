import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { compare, hash } from 'bcrypt';
import { User } from './entities/user.entity';
import { Prospect } from '../prospects/entities/prospect.entity';
import { Role } from '../common/enums';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateSignatureDto } from './dto/update-signature.dto';
import { UpdateMeDto } from './dto/update-me.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

type UserPublic = Omit<User, 'passwordHash'>;
type MonProfil = Pick<
  User,
  | 'id'
  | 'email'
  | 'prenom'
  | 'nom'
  | 'role'
  | 'signatureDataUri'
  | 'mustChangePassword'
>;

const CHAMPS_PUBLICS: (keyof User)[] = [
  'id',
  'email',
  'prenom',
  'nom',
  'role',
  'isActive',
  'mustChangePassword',
  'createdAt',
];

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly repo: Repository<User>,
    private readonly dataSource: DataSource,
  ) {}

  // Un utilisateur désactivé ne peut plus traiter ses prospects : ils
  // repassent « non assignés » pour être repris par un collègue.
  private async desassignerProspects(userId: string): Promise<void> {
    await this.dataSource
      .createQueryBuilder()
      .update(Prospect)
      .set({ assignedTo: null })
      .where('id_assigned = :userId', { userId })
      .execute();
  }

  // Empêche de se retrouver sans aucun administrateur actif (plus personne
  // ne pourrait gérer les comptes).
  private async assertPasDernierAdminActif(user: User): Promise<void> {
    if (user.role !== Role.ADMIN || !user.isActive) return;
    const admins = await this.repo.count({
      where: { role: Role.ADMIN, isActive: true },
    });
    if (admins <= 1) {
      throw new ConflictException(
        'Impossible : c’est le dernier administrateur actif',
      );
    }
  }

  async findAll(): Promise<UserPublic[]> {
    return this.repo.find({
      select: CHAMPS_PUBLICS,
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<UserPublic> {
    const user = await this.repo.findOne({
      where: { id },
      select: CHAMPS_PUBLICS,
    });
    if (!user) throw new NotFoundException('Utilisateur introuvable');
    return user;
  }

  async findMe(id: string): Promise<MonProfil> {
    const user = await this.repo.findOne({
      where: { id },
      select: [
        'id',
        'email',
        'prenom',
        'nom',
        'role',
        'signatureDataUri',
        'mustChangePassword',
      ],
    });
    if (!user) throw new NotFoundException('Utilisateur introuvable');
    return user;
  }

  async updateMe(id: string, dto: UpdateMeDto): Promise<MonProfil> {
    const user = await this.repo.findOneBy({ id });
    if (!user) throw new NotFoundException('Utilisateur introuvable');
    if (dto.email && dto.email !== user.email) {
      const existing = await this.repo.findOneBy({ email: dto.email });
      if (existing) throw new ConflictException('Email déjà utilisé');
    }
    if (dto.prenom) user.prenom = dto.prenom;
    if (dto.nom) user.nom = dto.nom;
    if (dto.email) user.email = dto.email;
    await this.repo.save(user);
    return this.findMe(id);
  }

  async changeMyPassword(id: string, dto: ChangePasswordDto): Promise<void> {
    const user = await this.repo.findOneBy({ id });
    if (!user) throw new NotFoundException('Utilisateur introuvable');

    const match = await compare(dto.currentPassword, user.passwordHash);
    if (!match) {
      // BadRequestException (400) et pas Unauthorized (401) : le frontend
      // traite tout 401 comme une session expirée et déconnecte l'utilisateur
      // (voir apiFetch) — ici c'est une erreur de saisie, pas d'authentification.
      throw new BadRequestException('Mot de passe actuel incorrect');
    }
    if (dto.newPassword === dto.currentPassword) {
      throw new BadRequestException(
        'Le nouveau mot de passe doit être différent de l’actuel',
      );
    }

    user.passwordHash = await hash(dto.newPassword, 12);
    user.mustChangePassword = false;
    await this.repo.save(user);
  }

  async updateMySignature(
    id: string,
    dto: UpdateSignatureDto,
  ): Promise<{ signatureDataUri: string | null }> {
    const user = await this.repo.findOneBy({ id });
    if (!user) throw new NotFoundException('Utilisateur introuvable');
    user.signatureDataUri = dto.signatureDataUri ?? null;
    await this.repo.save(user);
    return { signatureDataUri: user.signatureDataUri };
  }

  // Compte créé par un admin : le mot de passe saisi est provisoire.
  async create(dto: CreateUserDto): Promise<UserPublic> {
    const existing = await this.repo.findOneBy({ email: dto.email });
    if (existing) throw new ConflictException('Email déjà utilisé');

    const user = this.repo.create({
      prenom: dto.prenom,
      nom: dto.nom,
      email: dto.email,
      role: dto.role,
      passwordHash: await hash(dto.password, 12),
      mustChangePassword: true,
    });
    const saved = await this.repo.save(user);
    return this.findOne(saved.id);
  }

  async update(id: string, dto: UpdateUserDto): Promise<UserPublic> {
    const user = await this.repo.findOneBy({ id });
    if (!user) throw new NotFoundException('Utilisateur introuvable');
    if (dto.email && dto.email !== user.email) {
      const existing = await this.repo.findOneBy({ email: dto.email });
      if (existing) throw new ConflictException('Email déjà utilisé');
    }
    const retireUnAdmin =
      dto.isActive === false || (!!dto.role && dto.role !== Role.ADMIN);
    if (retireUnAdmin) await this.assertPasDernierAdminActif(user);

    const update: Partial<User> = {};
    if (dto.prenom) update.prenom = dto.prenom;
    if (dto.nom) update.nom = dto.nom;
    if (dto.email) update.email = dto.email;
    if (dto.role) update.role = dto.role;
    if (dto.isActive !== undefined) update.isActive = dto.isActive;
    // Réinitialisation par un admin : nouveau mot de passe provisoire.
    if (dto.password) {
      update.passwordHash = await hash(dto.password, 12);
      update.mustChangePassword = true;
    }
    await this.repo.update(id, update);

    if (dto.isActive === false && user.isActive) {
      await this.desassignerProspects(id);
    }
    return this.findOne(id);
  }

  // Départ d'un utilisateur : le compte est désactivé, jamais supprimé —
  // son nom reste dans l'historique (créateur, signataire, journal d'audit).
  async desactiver(id: string, currentUserId: string): Promise<void> {
    if (id === currentUserId) {
      throw new ConflictException(
        'Vous ne pouvez pas désactiver votre propre compte',
      );
    }
    const user = await this.repo.findOneBy({ id });
    if (!user) throw new NotFoundException('Utilisateur introuvable');
    await this.assertPasDernierAdminActif(user);
    await this.repo.update(id, { isActive: false });
    await this.desassignerProspects(id);
  }
}

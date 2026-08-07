import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { compare, hash } from 'bcrypt';
import { User } from './entities/user.entity';
import { Role } from '../common/enums';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateSignatureDto } from './dto/update-signature.dto';
import { UpdateMeDto } from './dto/update-me.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly repo: Repository<User>,
  ) {}

  async findAll(): Promise<Omit<User, 'passwordHash'>[]> {
    return this.repo.find({
      select: ['id', 'email', 'prenom', 'nom', 'role', 'isActive', 'createdAt'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Omit<User, 'passwordHash'>> {
    const user = await this.repo.findOne({
      where: { id },
      select: ['id', 'email', 'prenom', 'nom', 'role', 'isActive', 'createdAt'],
    });
    if (!user) throw new NotFoundException('Utilisateur introuvable');
    return user;
  }

  async findMe(
    id: string,
  ): Promise<
    Pick<User, 'id' | 'email' | 'prenom' | 'nom' | 'role' | 'signatureDataUri'>
  > {
    const user = await this.repo.findOne({
      where: { id },
      select: ['id', 'email', 'prenom', 'nom', 'role', 'signatureDataUri'],
    });
    if (!user) throw new NotFoundException('Utilisateur introuvable');
    return user;
  }

  async updateMe(
    id: string,
    dto: UpdateMeDto,
  ): Promise<
    Pick<User, 'id' | 'email' | 'prenom' | 'nom' | 'role' | 'signatureDataUri'>
  > {
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

    user.passwordHash = await hash(dto.newPassword, 12);
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

  async create(dto: CreateUserDto): Promise<Omit<User, 'passwordHash'>> {
    const existing = await this.repo.findOneBy({ email: dto.email });
    if (existing) throw new ConflictException('Email déjà utilisé');

    const passwordHash = await hash(dto.password, 12);
    const user = this.repo.create({
      prenom: dto.prenom,
      nom: dto.nom,
      email: dto.email,
      role: dto.role,
      passwordHash,
    });
    const saved = await this.repo.save(user);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash: _, ...rest } = saved;
    return rest;
  }

  async update(
    id: string,
    dto: UpdateUserDto,
  ): Promise<Omit<User, 'passwordHash'>> {
    const user = await this.repo.findOneBy({ id });
    if (!user) throw new NotFoundException('Utilisateur introuvable');

    if (dto.email && dto.email !== user.email) {
      const existing = await this.repo.findOneBy({ email: dto.email });
      if (existing) throw new ConflictException('Email déjà utilisé');
    }

    const update: {
      prenom?: string;
      nom?: string;
      email?: string;
      role?: Role;
      isActive?: boolean;
      passwordHash?: string;
    } = {};
    if (dto.prenom) update.prenom = dto.prenom;
    if (dto.nom) update.nom = dto.nom;
    if (dto.email) update.email = dto.email;
    if (dto.role) update.role = dto.role;
    if (dto.isActive !== undefined) update.isActive = dto.isActive;
    if (dto.password) update.passwordHash = await hash(dto.password, 12);

    await this.repo.update(id, update);
    return this.findOne(id);
  }

  async remove(id: string, currentUserId: string): Promise<void> {
    if (id === currentUserId) {
      throw new ConflictException(
        'Vous ne pouvez pas supprimer votre propre compte',
      );
    }

    const user = await this.repo.findOneBy({ id });
    if (!user) throw new NotFoundException('Utilisateur introuvable');

    await this.repo.remove(user);
  }
}

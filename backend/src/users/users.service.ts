import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { hash } from 'bcrypt';
import { User } from './entities/user.entity';
import { Role } from '../common/enums';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

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
}

import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LettreMission } from './entities/lettre-mission.entity';
import { Mission } from '../missions/entities/mission.entity';
import { User } from '../users/entities/user.entity';
import { CreateLettreMissionDto } from './dto/create-lettre.dto';

@Injectable()
export class LettresMissionService {
  constructor(
    @InjectRepository(LettreMission)
    private readonly repo: Repository<LettreMission>,
  ) {}

  async create(dto: CreateLettreMissionDto): Promise<LettreMission> {
    const derniere = await this.repo.findOne({
      where: { mission: { id: dto.missionId } },
      order: { version: 'DESC' },
    });
    const l = this.repo.create({
      mission: { id: dto.missionId } as Mission,
      contenu: dto.contenu,
      version: derniere ? derniere.version + 1 : 1,
    });
    return this.repo.save(l);
  }

  findByMission(missionId: string): Promise<LettreMission[]> {
    return this.repo.find({
      where: { mission: { id: missionId } },
      order: { version: 'DESC' },
    });
  }

  async findOne(id: string): Promise<LettreMission> {
    const l = await this.repo.findOne({
      where: { id },
      relations: ['mission', 'signataire'],
    });
    if (!l) throw new NotFoundException('Lettre de mission introuvable');
    return l;
  }

  async signer(id: string, userId: string): Promise<LettreMission> {
    const l = await this.repo.findOneBy({ id });
    if (!l) throw new NotFoundException('Lettre de mission introuvable');
    if (l.signeeParExpert) {
      throw new BadRequestException('Cette lettre de mission est déjà signée');
    }
    l.signeeParExpert = true;
    l.signeeAt = new Date();
    l.signataire = { id: userId } as User;
    return this.repo.save(l);
  }
}

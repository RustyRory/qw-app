import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Mission } from './entities/mission.entity';
import { Client } from '../clients/entities/client.entity';
import { User } from '../users/entities/user.entity';
import { StatutMission } from '../common/enums';
import { CreateMissionDto } from './dto/create-mission.dto';
import { UpdateMissionDto } from './dto/update-mission.dto';

@Injectable()
export class MissionsService {
  constructor(
    @InjectRepository(Mission)
    private readonly repo: Repository<Mission>,
  ) {}

  create(dto: CreateMissionDto, userId: string): Promise<Mission> {
    const m = this.repo.create({
      client: { id: dto.clientId } as Client,
      type: dto.type,
      description: dto.description ?? null,
      dateDebut: new Date(dto.dateDebut),
      dateFin: dto.dateFin ? new Date(dto.dateFin) : null,
      honoraires: dto.honoraires ?? null,
      createdBy: { id: userId } as User,
    });
    return this.repo.save(m);
  }

  findByClient(clientId: string): Promise<Mission[]> {
    return this.repo.find({
      where: { client: { id: clientId } },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Mission> {
    const m = await this.repo.findOne({
      where: { id },
      relations: ['client', 'createdBy'],
    });
    if (!m) throw new NotFoundException('Mission introuvable');
    return m;
  }

  async update(id: string, dto: UpdateMissionDto): Promise<Mission> {
    const m = await this.repo.findOneBy({ id });
    if (!m) throw new NotFoundException('Mission introuvable');
    if (dto.description !== undefined) m.description = dto.description ?? null;
    if (dto.dateFin !== undefined)
      m.dateFin = dto.dateFin ? new Date(dto.dateFin) : null;
    if (dto.honoraires !== undefined) m.honoraires = dto.honoraires;
    return this.repo.save(m);
  }

  async changerStatut(id: string, statut: StatutMission): Promise<Mission> {
    const m = await this.repo.findOneBy({ id });
    if (!m) throw new NotFoundException('Mission introuvable');
    if (
      m.statut === StatutMission.TERMINEE ||
      m.statut === StatutMission.RESILIEE
    ) {
      throw new BadRequestException(
        'Une mission clôturée ou résiliée ne peut plus changer de statut',
      );
    }
    m.statut = statut;
    if (
      statut === StatutMission.TERMINEE ||
      statut === StatutMission.RESILIEE
    ) {
      m.dateFin = new Date();
    }
    return this.repo.save(m);
  }

  async remove(id: string): Promise<void> {
    const m = await this.repo.findOneBy({ id });
    if (!m) throw new NotFoundException('Mission introuvable');
    await this.repo.remove(m);
  }
}

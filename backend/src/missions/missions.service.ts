import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Mission } from './entities/mission.entity';
import { User } from '../users/entities/user.entity';
import { StatutMission } from '../common/enums';
import { CreateMissionDto } from './dto/create-mission.dto';
import { UpdateMissionDto } from './dto/update-mission.dto';
import { LettresMissionService } from '../lettres-mission/lettres-mission.service';

@Injectable()
export class MissionsService {
  private readonly logger = new Logger(MissionsService.name);

  constructor(
    @InjectRepository(Mission)
    private readonly repo: Repository<Mission>,
    private readonly lettresMissionService: LettresMissionService,
  ) {}

  async create(dto: CreateMissionDto, userId: string): Promise<Mission> {
    if (!dto.clientId === !dto.prospectId) {
      throw new BadRequestException(
        'Renseignez soit clientId, soit prospectId (jamais les deux, ni aucun des deux)',
      );
    }
    const m = this.repo.create({
      client: dto.clientId ? { id: dto.clientId } : null,
      prospect: dto.prospectId ? { id: dto.prospectId } : null,
      type: dto.type,
      description: dto.description ?? null,
      dateDebut: new Date(dto.dateDebut),
      dateFin: dto.dateFin ? new Date(dto.dateFin) : null,
      honoraires: dto.honoraires ?? null,
      repartitionTravaux: dto.repartitionTravaux ?? null,
      createdBy: { id: userId } as User,
    });
    const saved = await this.repo.save(m);

    try {
      await this.lettresMissionService.generateForMission(saved.id);
    } catch (err) {
      this.logger.error(
        `Échec de génération de la lettre de mission pour la mission ${saved.id}`,
        err instanceof Error ? err.stack : String(err),
      );
    }

    return saved;
  }

  findByClient(clientId: string): Promise<Mission[]> {
    return this.repo.find({
      where: { client: { id: clientId } },
      relations: ['lettresMission', 'lettresMission.documentSigneClient'],
      order: { createdAt: 'DESC' },
    });
  }

  findByProspect(prospectId: string): Promise<Mission[]> {
    return this.repo.find({
      where: { prospect: { id: prospectId } },
      relations: ['lettresMission', 'lettresMission.documentSigneClient'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Mission> {
    const m = await this.repo.findOne({
      where: { id },
      relations: ['client', 'prospect', 'createdBy'],
    });
    if (!m) throw new NotFoundException('Mission introuvable');
    return m;
  }

  // Toute modification met la lettre de mission à jour : version non
  // signée régénérée (validation annulée), version signée → avenant.
  async update(id: string, dto: UpdateMissionDto): Promise<Mission> {
    const m = await this.repo.findOneBy({ id });
    if (!m) throw new NotFoundException('Mission introuvable');
    if (dto.description !== undefined) m.description = dto.description ?? null;
    if (dto.dateFin !== undefined)
      m.dateFin = dto.dateFin ? new Date(dto.dateFin) : null;
    if (dto.honoraires !== undefined) m.honoraires = dto.honoraires;
    if (dto.repartitionTravaux !== undefined)
      m.repartitionTravaux = dto.repartitionTravaux;
    const saved = await this.repo.save(m);

    try {
      await this.lettresMissionService.apresModificationMission(saved.id);
    } catch (err) {
      this.logger.error(
        `Échec de mise à jour de la lettre de mission pour la mission ${saved.id}`,
        err instanceof Error ? err.stack : String(err),
      );
    }
    return saved;
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
    // La/les lettre(s) de mission (brouillon) doivent être supprimées avant
    // la mission elle-même : la FK id_mission est NOT NULL / ON DELETE NO
    // ACTION, sinon la suppression échoue en violation de contrainte.
    await this.lettresMissionService.removeByMission(id);
    await this.repo.remove(m);
  }
}

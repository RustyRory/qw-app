import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlanningEtape } from './entities/planning-etape.entity';
import { Client } from '../clients/entities/client.entity';
import { User } from '../users/entities/user.entity';
import { StatutPlanningEtape } from '../common/enums';
import { CreateEtapeDto } from './dto/create-etape.dto';

@Injectable()
export class PlanningService {
  constructor(
    @InjectRepository(PlanningEtape)
    private readonly repo: Repository<PlanningEtape>,
  ) {}

  create(dto: CreateEtapeDto, userId: string): Promise<PlanningEtape> {
    const e = this.repo.create({
      client: { id: dto.clientId } as Client,
      titre: dto.titre,
      description: dto.description ?? null,
      type: dto.type,
      dateEcheance: dto.dateEcheance ? new Date(dto.dateEcheance) : null,
      assignedTo: dto.assignedToId ? { id: dto.assignedToId } : null,
      createdBy: { id: userId } as User,
    });
    return this.repo.save(e);
  }

  findByClient(clientId: string): Promise<PlanningEtape[]> {
    return this.repo.find({
      where: { client: { id: clientId } },
      order: { createdAt: 'DESC' },
    });
  }

  async complete(id: string, userId: string): Promise<PlanningEtape> {
    const e = await this.repo.findOneBy({ id });
    if (!e) throw new NotFoundException('Étape de planning introuvable');
    if (
      e.statut === StatutPlanningEtape.FAIT ||
      e.statut === StatutPlanningEtape.ANNULEE
    ) {
      throw new BadRequestException(
        'Cette étape est déjà clôturée et ne peut plus être complétée',
      );
    }
    e.statut = StatutPlanningEtape.FAIT;
    e.completedAt = new Date();
    e.completedBy = { id: userId } as User;
    return this.repo.save(e);
  }

  async remove(id: string): Promise<void> {
    const e = await this.repo.findOneBy({ id });
    if (!e) throw new NotFoundException('Étape de planning introuvable');
    await this.repo.remove(e);
  }
}

import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Obligation } from './entities/obligation.entity';
import { Client } from '../clients/entities/client.entity';
import { StatutObligation } from '../common/enums';
import { CreateObligationDto } from './dto/create-obligation.dto';

@Injectable()
export class ObligationsService {
  constructor(
    @InjectRepository(Obligation)
    private readonly repo: Repository<Obligation>,
  ) {}

  create(dto: CreateObligationDto): Promise<Obligation> {
    const o = this.repo.create({
      client: { id: dto.clientId } as Client,
      type: dto.type,
      dateEcheance: dto.dateEcheance ? new Date(dto.dateEcheance) : null,
    });
    return this.repo.save(o);
  }

  findByClient(clientId: string): Promise<Obligation[]> {
    return this.repo.find({
      where: { client: { id: clientId } },
      order: { dateEcheance: 'ASC' },
    });
  }

  async marquerFait(id: string): Promise<Obligation> {
    const o = await this.repo.findOneBy({ id });
    if (!o) throw new NotFoundException('Obligation introuvable');
    if (
      o.statut === StatutObligation.FAIT ||
      o.statut === StatutObligation.EXPIRE
    ) {
      throw new BadRequestException(
        'Cette obligation est déjà clôturée et ne peut plus être marquée comme faite',
      );
    }
    o.statut = StatutObligation.FAIT;
    o.completedAt = new Date();
    return this.repo.save(o);
  }

  findEnRetard(): Promise<Obligation[]> {
    return this.repo.find({
      where: { statut: StatutObligation.EN_RETARD },
      order: { dateEcheance: 'ASC' },
    });
  }
}

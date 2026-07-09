import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OperationSensible } from './entities/operation-sensible.entity';
import { Client } from '../clients/entities/client.entity';
import { User } from '../users/entities/user.entity';
import { StatutOperationSensible } from '../common/enums';
import { CreateOperationDto } from './dto/create-operation.dto';

@Injectable()
export class OperationsService {
  constructor(
    @InjectRepository(OperationSensible)
    private readonly repo: Repository<OperationSensible>,
  ) {}

  create(dto: CreateOperationDto, userId: string): Promise<OperationSensible> {
    const o = this.repo.create({
      client: { id: dto.clientId } as Client,
      type: dto.type,
      description: dto.description,
      montant: dto.montant ?? null,
      devise: dto.devise ?? null,
      signaleBy: { id: userId } as User,
    });
    return this.repo.save(o);
  }

  findByClient(clientId: string): Promise<OperationSensible[]> {
    return this.repo.find({
      where: { client: { id: clientId } },
      order: { createdAt: 'DESC' },
    });
  }

  async declareTracfin(
    id: string,
    date: string,
    userId: string,
  ): Promise<OperationSensible> {
    const o = await this.repo.findOneBy({ id });
    if (!o) throw new NotFoundException('Opération sensible introuvable');
    this.checkModifiable(o);
    o.statut = StatutOperationSensible.TRACFIN_DECLARE;
    o.tracfinDate = new Date(date);
    o.validatedAt = new Date();
    o.validatedBy = { id: userId } as User;
    return this.repo.save(o);
  }

  async classer(id: string, userId: string): Promise<OperationSensible> {
    const o = await this.repo.findOneBy({ id });
    if (!o) throw new NotFoundException('Opération sensible introuvable');
    this.checkModifiable(o);
    o.statut = StatutOperationSensible.CLASSEE;
    o.validatedAt = new Date();
    o.validatedBy = { id: userId } as User;
    return this.repo.save(o);
  }

  private checkModifiable(o: OperationSensible): void {
    if (
      o.statut === StatutOperationSensible.CLASSEE ||
      o.statut === StatutOperationSensible.TRACFIN_DECLARE
    ) {
      throw new BadRequestException(
        'Cette opération sensible a déjà été clôturée',
      );
    }
  }
}

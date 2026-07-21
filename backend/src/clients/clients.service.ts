import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Client } from './entities/client.entity';
import { Role, StatutKyc } from '../common/enums';
import { AuditAction, AuditLog } from '../audit/entities/audit-log.entity';
import { User } from '../users/entities/user.entity';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { ScreeningDto } from './dto/screening.dto';
import { generateNextRef } from '../common/generate-ref';
import { ScoringService } from '../scoring/scoring.service';

type AuthUser = { id: string; role: Role };

@Injectable()
export class ClientsService {
  constructor(
    @InjectRepository(Client)
    private readonly clientsRepo: Repository<Client>,
    @InjectRepository(AuditLog)
    private readonly auditRepo: Repository<AuditLog>,
    private readonly dataSource: DataSource,
    private readonly scoringService: ScoringService,
  ) {}

  async create(dto: CreateClientDto, authUser: AuthUser): Promise<Client> {
    const saved = await this.dataSource.transaction(async (manager) => {
      const year = new Date().getFullYear();
      const ref = await generateNextRef(manager, Client, `QW-${year}-`);

      const client = manager.create(Client, {
        ...dto,
        ref,
        createdBy: { id: authUser.id } as User,
      });
      const saved = await manager.save(client);

      await manager.save(
        manager.create(AuditLog, {
          action: AuditAction.CREATE,
          ressource: 'Client',
          ressourceId: saved.id,
          details: { ref },
          utilisateur: { id: authUser.id } as User,
        }),
      );

      return saved;
    });

    await this.scoringService.recalculateForClient(saved.id, authUser.id);

    return saved;
  }

  async findAll(authUser: AuthUser): Promise<Client[]> {
    const qb = this.clientsRepo
      .createQueryBuilder('client')
      .leftJoinAndSelect('client.createdBy', 'createdBy');

    if (authUser.role === Role.COLLABORATEUR) {
      qb.where('createdBy.id = :id', { id: authUser.id });
    }

    return qb.orderBy('client.createdAt', 'DESC').getMany();
  }

  async findOne(id: string): Promise<Client> {
    const client = await this.clientsRepo.findOne({
      where: { id },
      relations: [
        'documents',
        'scores',
        'createdBy',
        'kycValidatedBy',
        'prospect',
      ],
    });
    if (!client) throw new NotFoundException('Client introuvable');
    return client;
  }

  async update(
    id: string,
    dto: UpdateClientDto,
    authUser: AuthUser,
  ): Promise<Client> {
    const client = await this.findOne(id);
    Object.assign(client, dto);
    const saved = await this.clientsRepo.save(client);

    await this.auditRepo.save(
      this.auditRepo.create({
        action: AuditAction.UPDATE,
        ressource: 'Client',
        ressourceId: id,
        details: dto as Record<string, unknown>,
        utilisateur: { id: authUser.id } as User,
      }),
    );

    await this.scoringService.recalculateForClient(id, authUser.id);

    return saved;
  }

  // Valide la fiche KYC du dossier (KYC désormais fusionné dans Client)
  async validate(id: string, authUser: AuthUser): Promise<Client> {
    const client = await this.clientsRepo.findOneBy({ id });
    if (!client) throw new NotFoundException('Client introuvable');

    client.kycStatut = StatutKyc.VALIDE;
    client.kycCompletedAt = new Date();
    client.kycValidatedBy = { id: authUser.id } as User;
    const saved = await this.clientsRepo.save(client);

    await this.auditRepo.save(
      this.auditRepo.create({
        action: AuditAction.VALIDATE,
        ressource: 'Client',
        ressourceId: id,
        details: null,
        utilisateur: { id: authUser.id } as User,
      }),
    );

    return saved;
  }

  // Enregistre le résultat d'un screening (listes de sanctions / PPE) : saisie
  // manuelle du résultat, faute d'API de listes de sanctions intégrée.
  async updateScreening(
    id: string,
    dto: ScreeningDto,
    authUser: AuthUser,
  ): Promise<Client> {
    const client = await this.clientsRepo.findOneBy({ id });
    if (!client) throw new NotFoundException('Client introuvable');

    client.screeningStatut = dto.statut;
    client.screeningDate = new Date();
    const saved = await this.clientsRepo.save(client);

    await this.auditRepo.save(
      this.auditRepo.create({
        action: AuditAction.VALIDATE,
        ressource: 'Client',
        ressourceId: id,
        details: { screeningStatut: dto.statut },
        utilisateur: { id: authUser.id } as User,
      }),
    );

    await this.scoringService.recalculateForClient(id, authUser.id);

    return saved;
  }

  async remove(id: string, authUser: AuthUser): Promise<void> {
    const client = await this.clientsRepo.findOneBy({ id });
    if (!client) throw new NotFoundException('Client introuvable');

    await this.clientsRepo.softDelete(id);

    await this.auditRepo.save(
      this.auditRepo.create({
        action: AuditAction.DELETE,
        ressource: 'Client',
        ressourceId: id,
        details: null,
        utilisateur: { id: authUser.id } as User,
      }),
    );
  }
}

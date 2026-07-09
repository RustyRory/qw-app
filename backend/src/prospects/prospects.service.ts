import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Like, Repository } from 'typeorm';
import { Prospect } from './entities/prospect.entity';
import { Client } from '../clients/entities/client.entity';
import { Role, StatutClient, StatutKanban } from '../common/enums';
import { AuditAction, AuditLog } from '../audit/entities/audit-log.entity';
import { User } from '../users/entities/user.entity';
import { CreateProspectDto } from './dto/create-prospect.dto';
import { UpdateProspectDto } from './dto/update-prospect.dto';

type AuthUser = { id: string; role: Role };

@Injectable()
export class ProspectsService {
  constructor(
    @InjectRepository(Prospect)
    private readonly prospectsRepo: Repository<Prospect>,
    @InjectRepository(AuditLog)
    private readonly auditRepo: Repository<AuditLog>,
    private readonly dataSource: DataSource,
  ) {}

  async create(dto: CreateProspectDto, authUser: AuthUser): Promise<Prospect> {
    return this.dataSource.transaction(async (manager) => {
      const year = new Date().getFullYear();
      const count = await manager.count(Prospect, {
        where: { ref: Like(`QWP-${year}-%`) },
        withDeleted: true,
      });
      const seq = String(count + 1).padStart(3, '0');
      const ref = `QWP-${year}-${seq}`;

      const prospect = manager.create(Prospect, {
        ...dto,
        ref,
        createdBy: { id: authUser.id } as User,
      });
      const saved = await manager.save(prospect);

      await manager.save(
        manager.create(AuditLog, {
          action: AuditAction.CREATE,
          ressource: 'Prospect',
          ressourceId: saved.id,
          details: { ref, nom: saved.nom },
          utilisateur: { id: authUser.id } as User,
        }),
      );

      return saved;
    });
  }

  async findAll(authUser: AuthUser): Promise<Prospect[]> {
    const qb = this.prospectsRepo
      .createQueryBuilder('prospect')
      .leftJoinAndSelect('prospect.createdBy', 'createdBy')
      .leftJoinAndSelect('prospect.assignedTo', 'assignedTo');

    if (authUser.role === Role.COLLABORATEUR) {
      qb.where('createdBy.id = :id', { id: authUser.id });
    }

    return qb.orderBy('prospect.createdAt', 'DESC').getMany();
  }

  async findOne(id: string): Promise<Prospect> {
    const prospect = await this.prospectsRepo.findOne({
      where: { id },
      relations: ['createdBy', 'assignedTo'],
    });
    if (!prospect) throw new NotFoundException('Prospect introuvable');
    return prospect;
  }

  async update(
    id: string,
    dto: UpdateProspectDto,
    authUser: AuthUser,
  ): Promise<Prospect> {
    const prospect = await this.findOne(id);
    if (prospect.statutKanban === StatutKanban.CONVERTI) {
      throw new BadRequestException(
        'Un prospect converti ne peut plus être modifié',
      );
    }

    const { assignedToId, ...rest } = dto;
    Object.assign(prospect, rest);
    if (assignedToId !== undefined) {
      prospect.assignedTo = assignedToId
        ? ({ id: assignedToId } as User)
        : null;
    }
    const saved = await this.prospectsRepo.save(prospect);

    await this.auditRepo.save(
      this.auditRepo.create({
        action: AuditAction.UPDATE,
        ressource: 'Prospect',
        ressourceId: id,
        details: dto as Record<string, unknown>,
        utilisateur: { id: authUser.id } as User,
      }),
    );

    return saved;
  }

  // Convertit le prospect en client : crée un Client (sans KYC), marque le prospect CONVERTI
  async convertToClient(id: string, authUser: AuthUser): Promise<Client> {
    const prospect = await this.findOne(id);

    if (prospect.statutKanban === StatutKanban.CONVERTI) {
      throw new BadRequestException('Ce prospect est déjà converti en client');
    }

    return this.dataSource.transaction(async (manager) => {
      // Générer la référence client
      const year = new Date().getFullYear();
      const count = await manager.count(Client, {
        where: { ref: Like(`QW-${year}-%`) },
        withDeleted: true,
      });
      const seq = String(count + 1).padStart(3, '0');
      const ref = `QW-${year}-${seq}`;

      // Créer le client à partir des champs du prospect, sans KYC
      const client = manager.create(Client, {
        ref,
        raisonSociale: prospect.nom,
        typeEntite: prospect.typeEntite,
        siret: prospect.siret,
        codeNaf: prospect.codeNaf,
        activitePrincipale: prospect.activite,
        adresseSiege: prospect.adresse,
        ville: prospect.ville,
        codePostal: prospect.codePostal,
        pays: prospect.pays,
        chiffreAffaires: prospect.chiffreAffaires,
        effectif: prospect.effectif,
        statut: StatutClient.ACTIF,
        createdBy: { id: authUser.id } as User,
      });
      const savedClient = await manager.save(client);

      // Audit : création du client
      await manager.save(
        manager.create(AuditLog, {
          action: AuditAction.CREATE,
          ressource: 'Client',
          ressourceId: savedClient.id,
          details: { ref, convertedFromProspect: id },
          utilisateur: { id: authUser.id } as User,
        }),
      );

      // Marquer le prospect comme converti
      prospect.statutKanban = StatutKanban.CONVERTI;
      prospect.client = savedClient;
      await manager.save(prospect);

      // Audit : conversion du prospect
      await manager.save(
        manager.create(AuditLog, {
          action: AuditAction.UPDATE,
          ressource: 'Prospect',
          ressourceId: id,
          details: {
            statutKanban: StatutKanban.CONVERTI,
            clientId: savedClient.id,
          },
          utilisateur: { id: authUser.id } as User,
        }),
      );

      return savedClient;
    });
  }

  async remove(id: string, authUser: AuthUser): Promise<void> {
    const prospect = await this.findOne(id);

    if (prospect.statutKanban === StatutKanban.CONVERTI) {
      throw new BadRequestException(
        'Impossible de supprimer un prospect converti en client',
      );
    }

    await this.prospectsRepo.softDelete(id);

    await this.auditRepo.save(
      this.auditRepo.create({
        action: AuditAction.DELETE,
        ressource: 'Prospect',
        ressourceId: id,
        details: { nom: prospect.nom },
        utilisateur: { id: authUser.id } as User,
      }),
    );
  }
}

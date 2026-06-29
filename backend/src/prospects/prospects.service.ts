import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Like, Repository } from 'typeorm';
import { Prospect, ProspectStatut } from './entities/prospect.entity';
import { Client, ClientStatut } from '../clients/entities/client.entity';
import { Kyc } from '../kyc/entities/kyc.entity';
import { AuditAction, AuditLog } from '../audit/entities/audit-log.entity';
import { User, UserRole } from '../users/entities/user.entity';
import { CreateProspectDto } from './dto/create-prospect.dto';
import { UpdateProspectDto } from './dto/update-prospect.dto';

type AuthUser = { id: string; role: UserRole };

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
    const prospect = this.prospectsRepo.create({
      ...dto,
      createur: { id: authUser.id } as User,
    });
    const saved = await this.prospectsRepo.save(prospect);

    await this.auditRepo.save(
      this.auditRepo.create({
        action: AuditAction.CREATE,
        entiteType: 'Prospect',
        entiteId: saved.id,
        details: { nom: saved.nom, prenom: saved.prenom },
        utilisateur: { id: authUser.id } as User,
      }),
    );

    return saved;
  }

  async findAll(authUser: AuthUser): Promise<Prospect[]> {
    const qb = this.prospectsRepo
      .createQueryBuilder('prospect')
      .leftJoinAndSelect('prospect.createur', 'createur');

    if (authUser.role === UserRole.COLLABORATEUR) {
      qb.where('createur.id = :id', { id: authUser.id });
    }

    return qb.orderBy('prospect.createdAt', 'DESC').getMany();
  }

  async findOne(id: string): Promise<Prospect> {
    const prospect = await this.prospectsRepo.findOne({
      where: { id },
      relations: ['createur'],
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
    if (prospect.statut === ProspectStatut.CONVERTI) {
      throw new BadRequestException(
        'Un prospect converti ne peut plus être modifié',
      );
    }
    Object.assign(prospect, dto);
    const saved = await this.prospectsRepo.save(prospect);

    await this.auditRepo.save(
      this.auditRepo.create({
        action: AuditAction.UPDATE,
        entiteType: 'Prospect',
        entiteId: id,
        details: dto as Record<string, unknown>,
        utilisateur: { id: authUser.id } as User,
      }),
    );

    return saved;
  }

  // Convertit le prospect en client : crée un Client + KYC vide, marque le prospect CONVERTI
  async convertToClient(id: string, authUser: AuthUser): Promise<Client> {
    const prospect = await this.findOne(id);

    if (prospect.statut === ProspectStatut.CONVERTI) {
      throw new BadRequestException('Ce prospect est déjà converti en client');
    }

    return this.dataSource.transaction(async (manager) => {
      // Générer la référence client
      const year = new Date().getFullYear();
      const count = await manager.count(Client, {
        where: { reference: Like(`QW-${year}-%`) },
        withDeleted: true,
      });
      const seq = String(count + 1).padStart(3, '0');
      const reference = `QW-${year}-${seq}`;

      // Créer le client à partir des données du prospect
      const client = manager.create(Client, {
        prenom: prospect.prenom,
        nom: prospect.nom,
        raisonSociale: prospect.raisonSociale,
        email: prospect.email,
        telephone: prospect.telephone,
        statut: ClientStatut.EN_COURS,
        reference,
        createur: { id: authUser.id } as User,
      });
      const savedClient = await manager.save(client);

      // Créer une fiche KYC vide (pré-remplie avec les données disponibles)
      const kyc = manager.create(Kyc, {
        client: { id: savedClient.id } as Client,
        secteurActivite: prospect.secteurActivite,
        paysResidence: prospect.paysResidence,
        estPep: prospect.estPep,
      });
      await manager.save(kyc);

      // Audit : création du client
      await manager.save(
        manager.create(AuditLog, {
          action: AuditAction.CREATE,
          entiteType: 'Client',
          entiteId: savedClient.id,
          details: { reference, convertedFromProspect: id },
          utilisateur: { id: authUser.id } as User,
        }),
      );

      // Marquer le prospect comme converti
      prospect.statut = ProspectStatut.CONVERTI;
      prospect.clientId = savedClient.id;
      await manager.save(prospect);

      // Audit : conversion du prospect
      await manager.save(
        manager.create(AuditLog, {
          action: AuditAction.UPDATE,
          entiteType: 'Prospect',
          entiteId: id,
          details: {
            statut: ProspectStatut.CONVERTI,
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

    if (prospect.statut === ProspectStatut.CONVERTI) {
      throw new BadRequestException(
        'Impossible de supprimer un prospect converti en client',
      );
    }

    await this.prospectsRepo.delete(id);

    await this.auditRepo.save(
      this.auditRepo.create({
        action: AuditAction.DELETE,
        entiteType: 'Prospect',
        entiteId: id,
        details: { nom: prospect.nom, prenom: prospect.prenom },
        utilisateur: { id: authUser.id } as User,
      }),
    );
  }
}

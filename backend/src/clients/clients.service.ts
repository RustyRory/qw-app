import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Like, Repository } from 'typeorm';
import { Client, ClientStatut } from './entities/client.entity';
import { Kyc } from '../kyc/entities/kyc.entity';
import { AuditAction, AuditLog } from '../audit/entities/audit-log.entity';
import { User, UserRole } from '../users/entities/user.entity';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';

type AuthUser = { id: string; role: UserRole };

@Injectable()
export class ClientsService {
  constructor(
    @InjectRepository(Client)
    private readonly clientsRepo: Repository<Client>,
    @InjectRepository(Kyc)
    private readonly kycRepo: Repository<Kyc>,
    @InjectRepository(AuditLog)
    private readonly auditRepo: Repository<AuditLog>,
    private readonly dataSource: DataSource,
  ) {}

  async create(dto: CreateClientDto, authUser: AuthUser): Promise<Client> {
    return this.dataSource.transaction(async (manager) => {
      const year = new Date().getFullYear();
      const count = await manager.count(Client, {
        where: { reference: Like(`QW-${year}-%`) },
        withDeleted: true,
      });
      const seq = String(count + 1).padStart(3, '0');
      const reference = `QW-${year}-${seq}`;

      const client = manager.create(Client, {
        ...dto,
        reference,
        createur: { id: authUser.id } as User,
      });
      const saved = await manager.save(client);

      const kyc = manager.create(Kyc, { client: { id: saved.id } as Client });
      await manager.save(kyc);

      await manager.save(
        manager.create(AuditLog, {
          action: AuditAction.CREATE,
          entiteType: 'Client',
          entiteId: saved.id,
          details: { reference },
          utilisateur: { id: authUser.id } as User,
        }),
      );

      return saved;
    });
  }

  async findAll(authUser: AuthUser): Promise<Client[]> {
    const qb = this.clientsRepo
      .createQueryBuilder('client')
      .leftJoinAndSelect('client.createur', 'createur');

    if (authUser.role === UserRole.COLLABORATEUR) {
      qb.where('createur.id = :id', { id: authUser.id });
    }

    return qb.orderBy('client.createdAt', 'DESC').getMany();
  }

  async findOne(id: string): Promise<Client> {
    const client = await this.clientsRepo.findOne({
      where: { id },
      relations: ['kyc', 'documents', 'riskScores', 'createur', 'validateur'],
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
        entiteType: 'Client',
        entiteId: id,
        details: dto as Record<string, unknown>,
        utilisateur: { id: authUser.id } as User,
      }),
    );

    return saved;
  }

  async validate(id: string, authUser: AuthUser): Promise<Client> {
    const client = await this.clientsRepo.findOneBy({ id });
    if (!client) throw new NotFoundException('Client introuvable');

    client.statut = ClientStatut.VALIDE;
    client.validateur = { id: authUser.id } as User;
    const saved = await this.clientsRepo.save(client);

    await this.auditRepo.save(
      this.auditRepo.create({
        action: AuditAction.VALIDATE,
        entiteType: 'Client',
        entiteId: id,
        details: null,
        utilisateur: { id: authUser.id } as User,
      }),
    );

    return saved;
  }

  async remove(id: string, authUser: AuthUser): Promise<void> {
    const client = await this.clientsRepo.findOneBy({ id });
    if (!client) throw new NotFoundException('Client introuvable');

    await this.clientsRepo.softDelete(id);

    await this.auditRepo.save(
      this.auditRepo.create({
        action: AuditAction.DELETE,
        entiteType: 'Client',
        entiteId: id,
        details: null,
        utilisateur: { id: authUser.id } as User,
      }),
    );
  }
}

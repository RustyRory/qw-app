import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OperationSensible } from './entities/operation-sensible.entity';
import { Client } from '../clients/entities/client.entity';
import { User } from '../users/entities/user.entity';
import { Role, StatutOperationSensible } from '../common/enums';
import { CreateOperationDto } from './dto/create-operation.dto';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '../audit/entities/audit-log.entity';
import { NotificationsService } from '../notifications/notifications.service';

type AuthUser = { id: string; role: Role };

// Circuit : SIGNALÉE → EN ANALYSE → CLASSÉE (motif obligatoire) ou
// DÉCLARÉE À TRACFIN. Confidentialité : un collaborateur ne voit que ce
// qu'il a lui-même signalé.
@Injectable()
export class OperationsService {
  constructor(
    @InjectRepository(OperationSensible)
    private readonly repo: Repository<OperationSensible>,
    private readonly auditService: AuditService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(
    dto: CreateOperationDto,
    authUser: AuthUser,
  ): Promise<OperationSensible> {
    const saved = await this.repo.save(
      this.repo.create({
        client: { id: dto.clientId } as Client,
        type: dto.type,
        description: dto.description,
        montant: dto.montant ?? null,
        devise: dto.devise ?? null,
        signaleBy: { id: authUser.id } as User,
      }),
    );
    await this.auditService.log(
      authUser.id,
      AuditAction.CREATE,
      'OperationSensible',
      saved.id,
      { type: dto.type },
    );
    // Pas le nom du client dans la notification (confidentialité).
    await this.notificationsService.creerPourRoles(
      [Role.EXPERT_COMPTABLE],
      'Opération sensible signalée',
      'Une opération sensible attend votre analyse.',
      `/dashboard/clients/${dto.clientId}?tab=operations`,
    );
    return saved;
  }

  findByClient(
    clientId: string,
    authUser: AuthUser,
  ): Promise<OperationSensible[]> {
    return this.repo.find({
      where: {
        client: { id: clientId },
        ...(authUser.role === Role.COLLABORATEUR
          ? { signaleBy: { id: authUser.id } }
          : {}),
      },
      relations: ['signaleBy', 'analysePar', 'validatedBy'],
      order: { createdAt: 'DESC' },
    });
  }

  private async getOuverte(id: string): Promise<OperationSensible> {
    const o = await this.repo.findOneBy({ id });
    if (!o) throw new NotFoundException('Opération sensible introuvable');
    if (
      o.statut === StatutOperationSensible.CLASSEE ||
      o.statut === StatutOperationSensible.TRACFIN_DECLARE
    ) {
      throw new BadRequestException(
        'Cette opération sensible a déjà été clôturée',
      );
    }
    return o;
  }

  async prendreEnAnalyse(
    id: string,
    authUser: AuthUser,
  ): Promise<OperationSensible> {
    const o = await this.getOuverte(id);
    if (o.statut !== StatutOperationSensible.SIGNALEE) {
      throw new BadRequestException('Cette opération est déjà en analyse');
    }
    o.statut = StatutOperationSensible.EN_ANALYSE;
    o.analyseAt = new Date();
    o.analysePar = { id: authUser.id } as User;
    const saved = await this.repo.save(o);
    await this.auditService.log(
      authUser.id,
      AuditAction.UPDATE,
      'OperationSensible',
      id,
      { statut: o.statut },
    );
    return saved;
  }

  private assertEnAnalyse(o: OperationSensible): void {
    if (o.statut !== StatutOperationSensible.EN_ANALYSE) {
      throw new ForbiddenException(
        'L’opération doit d’abord être prise en analyse',
      );
    }
  }

  async declareTracfin(
    id: string,
    date: string,
    authUser: AuthUser,
  ): Promise<OperationSensible> {
    const o = await this.getOuverte(id);
    this.assertEnAnalyse(o);
    o.statut = StatutOperationSensible.TRACFIN_DECLARE;
    o.tracfinDate = new Date(date);
    o.validatedAt = new Date();
    o.validatedBy = { id: authUser.id } as User;
    const saved = await this.repo.save(o);
    await this.auditService.log(
      authUser.id,
      AuditAction.VALIDATE,
      'OperationSensible',
      id,
      { statut: o.statut, tracfinDate: date },
    );
    return saved;
  }

  async classer(
    id: string,
    motif: string,
    authUser: AuthUser,
  ): Promise<OperationSensible> {
    if (!motif?.trim()) {
      throw new BadRequestException('Le motif de classement est obligatoire');
    }
    const o = await this.getOuverte(id);
    this.assertEnAnalyse(o);
    o.statut = StatutOperationSensible.CLASSEE;
    o.motifClassement = motif.trim();
    o.validatedAt = new Date();
    o.validatedBy = { id: authUser.id } as User;
    const saved = await this.repo.save(o);
    await this.auditService.log(
      authUser.id,
      AuditAction.VALIDATE,
      'OperationSensible',
      id,
      { statut: o.statut, motif: o.motifClassement },
    );
    return saved;
  }
}

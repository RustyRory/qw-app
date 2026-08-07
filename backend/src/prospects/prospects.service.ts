import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, LessThan, Repository } from 'typeorm';
import { Prospect } from './entities/prospect.entity';
import { Client } from '../clients/entities/client.entity';
import { Role, StatutClient, StatutKanban } from '../common/enums';
import { AuditAction, AuditLog } from '../audit/entities/audit-log.entity';
import { User } from '../users/entities/user.entity';
import { CreateProspectDto } from './dto/create-prospect.dto';
import { UpdateProspectDto } from './dto/update-prospect.dto';
import { generateNextRef } from '../common/generate-ref';
import { ScoringService } from '../scoring/scoring.service';
import { NotificationsService } from '../notifications/notifications.service';

type AuthUser = { id: string; role: Role };

@Injectable()
export class ProspectsService {
  constructor(
    @InjectRepository(Prospect)
    private readonly prospectsRepo: Repository<Prospect>,
    @InjectRepository(AuditLog)
    private readonly auditRepo: Repository<AuditLog>,
    private readonly dataSource: DataSource,
    private readonly scoringService: ScoringService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(dto: CreateProspectDto, authUser: AuthUser): Promise<Prospect> {
    return this.dataSource.transaction(async (manager) => {
      const year = new Date().getFullYear();
      const ref = await generateNextRef(manager, Prospect, `QWP-${year}-`);

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

  // Un prospect converti n'a plus sa place dans le pipeline actif — il reste
  // en base (traçabilité LCB-FT, cf. remove() plus bas) mais n'est plus
  // remonté ici ; il reste accessible directement via findOne() ou depuis la
  // fiche du client qu'il a généré.
  // Lecture ouverte à tous les rôles authentifiés, quel que soit le
  // créateur/assigné — seule la modification est verrouillée par rôle et
  // assignation (cf. assertCollaborateurPeutTraiter). Un COLLABORATEUR doit
  // voir tous les prospects actifs pour pouvoir en repérer un à s'approprier.
  async findAll(): Promise<Prospect[]> {
    return this.prospectsRepo
      .createQueryBuilder('prospect')
      .leftJoinAndSelect('prospect.createdBy', 'createdBy')
      .leftJoinAndSelect('prospect.assignedTo', 'assignedTo')
      .leftJoinAndSelect('prospect.client', 'client')
      .andWhere('prospect.statutKanban != :converti', {
        converti: StatutKanban.CONVERTI,
      })
      .orderBy('prospect.createdAt', 'DESC')
      .getMany();
  }

  async findOne(id: string): Promise<Prospect> {
    const prospect = await this.prospectsRepo.findOne({
      where: { id },
      relations: ['createdBy', 'assignedTo', 'client', 'questionnaire'],
    });
    if (!prospect) throw new NotFoundException('Prospect introuvable');
    return prospect;
  }

  // Un COLLABORATEUR ne peut traiter que les prospects qui lui sont assignés
  // (ou pas encore assignés, pour pouvoir se les approprier). RESPONSABLE /
  // EXPERT_COMPTABLE / ADMIN passent sans contrainte : leurs actions
  // (validation, conversion...) sont un pool partagé au niveau du rôle, pas
  // une file personnelle — cf. discussion sur le ticketing.
  private assertCollaborateurPeutTraiter(
    prospect: Prospect,
    authUser: AuthUser,
  ): void {
    if (authUser.role !== Role.COLLABORATEUR) return;
    const assigneeId = prospect.assignedTo?.id ?? null;
    if (assigneeId !== null && assigneeId !== authUser.id) {
      throw new ForbiddenException(
        'Seul le collaborateur assigné à ce prospect peut le traiter',
      );
    }
  }

  async update(
    id: string,
    dto: UpdateProspectDto,
    authUser: AuthUser,
  ): Promise<Prospect> {
    const prospect = await this.findOne(id);
    this.assertCollaborateurPeutTraiter(prospect, authUser);
    // Refuser est une décision métier réservée à
    // RESPONSABLE/EXPERT_COMPTABLE/ADMIN (cf. /refuser) — un COLLABORATEUR
    // ne doit pas pouvoir arriver au même résultat en glissant simplement la
    // carte vers la colonne "Refusé" du Kanban.
    if (
      authUser.role === Role.COLLABORATEUR &&
      dto.statutKanban === StatutKanban.REFUSE &&
      prospect.statutKanban !== StatutKanban.REFUSE
    ) {
      throw new ForbiddenException(
        'Seuls responsable, expert-comptable ou admin peuvent refuser un prospect',
      );
    }
    // Le statut kanban reste toujours librement modifiable, y compris sur un
    // prospect réellement converti (le kanban est un outil de suivi, pas un
    // reflet strict de l'état réel) — seuls les autres champs (identité,
    // assignation…) restent verrouillés une fois un Client réellement créé.
    const modifieAutreChampQueStatut = Object.keys(dto).some(
      (key) => key !== 'statutKanban',
    );
    if (prospect.client && modifieAutreChampQueStatut) {
      throw new BadRequestException(
        'Un prospect converti ne peut plus être modifié (le statut kanban reste modifiable)',
      );
    }

    const previousAssignedToId = prospect.assignedTo?.id ?? null;
    const { assignedToId, ...rest } = dto;
    const wasRefuse = prospect.statutKanban === StatutKanban.REFUSE;
    Object.assign(prospect, rest);
    if (assignedToId !== undefined) {
      prospect.assignedTo = assignedToId
        ? ({ id: assignedToId } as User)
        : null;
    }
    if (dto.statutKanban !== undefined) {
      if (dto.statutKanban === StatutKanban.REFUSE && !wasRefuse) {
        prospect.refusedAt = new Date();
      } else if (dto.statutKanban !== StatutKanban.REFUSE && wasRefuse) {
        prospect.refusedAt = null;
      }
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

    // Notifie le collab uniquement lors d'une (ré)assignation vers quelqu'un
    // de nouveau — pas de bruit sur la désassignation ni sur les autres
    // modifications (cf. décision : pas de notif "large" à la création).
    if (assignedToId && assignedToId !== previousAssignedToId) {
      await this.notificationsService.creerPour(
        [assignedToId],
        'Prospect assigné',
        saved.nom,
        `/dashboard/prospects/${saved.id}`,
      );
    }

    return saved;
  }

  // Convertit le prospect en client : crée un Client (sans KYC), marque le prospect CONVERTI
  async convertToClient(id: string, authUser: AuthUser): Promise<Client> {
    const prospect = await this.findOne(id);

    if (prospect.client) {
      throw new BadRequestException('Ce prospect est déjà converti en client');
    }

    // PPE est un champ KYC du client (pas juste un critère de scoring) : sans
    // ce report, un prospect où le collaborateur avait répondu "oui" à D1_11
    // redevient un client marqué non-PPE par défaut à la conversion.
    const reponses = prospect.questionnaire?.reponses as
      | Record<string, unknown>
      | undefined;
    const ppeDepuisQuestionnaire = reponses?.['D1_11'] === 'oui';

    const savedClient = await this.dataSource.transaction(async (manager) => {
      // Générer la référence client
      const year = new Date().getFullYear();
      const ref = await generateNextRef(manager, Client, `QW-${year}-`);

      // Créer le client à partir des champs du prospect, sans KYC
      const client = manager.create(Client, {
        ref,
        raisonSociale: prospect.nom,
        typeEntite: prospect.typeEntite,
        siret: prospect.siret,
        formeJuridique: prospect.formeJuridique,
        representantLegal: prospect.representantLegal,
        email: prospect.email,
        telephone: prospect.telephone,
        codeNaf: prospect.codeNaf,
        activitePrincipale: prospect.activite,
        adresseSiege: prospect.adresse,
        ville: prospect.ville,
        codePostal: prospect.codePostal,
        pays: prospect.pays,
        chiffreAffaires: prospect.chiffreAffaires,
        effectif: prospect.effectif,
        notes: prospect.notes,
        ppe: ppeDepuisQuestionnaire,
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

    await this.scoringService.recalculateForClient(savedClient.id, authUser.id);

    return savedClient;
  }

  async remove(id: string, authUser: AuthUser): Promise<void> {
    const prospect = await this.findOne(id);
    // Règle volontairement plus stricte que assertCollaborateurPeutTraiter :
    // supprimer n'est permis à un COLLABORATEUR que sur ce qu'il a lui-même
    // créé (fausse manip à corriger) — refuser un prospect créé par un
    // tiers ou qui lui a été assigné est une décision métier réservée à
    // RESPONSABLE/EXPERT_COMPTABLE/ADMIN (cf. endpoint /refuser).
    if (
      authUser.role === Role.COLLABORATEUR &&
      prospect.createdBy.id !== authUser.id
    ) {
      throw new ForbiddenException(
        'Seul le créateur du prospect peut le supprimer',
      );
    }

    if (prospect.client) {
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

  // Job quotidien : les prospects refusés depuis plus de 7 jours sont
  // archivés (soft-delete) pour désencombrer le kanban. La donnée reste en
  // base (deletedAt) et consultable en cas de besoin de revenir en arrière.
  @Cron(CronExpression.EVERY_DAY_AT_4AM)
  async archiverProspectsRefuses(): Promise<void> {
    const limite = new Date();
    limite.setDate(limite.getDate() - 7);

    const expires = await this.prospectsRepo.find({
      where: {
        statutKanban: StatutKanban.REFUSE,
        refusedAt: LessThan(limite),
      },
    });

    for (const prospect of expires) {
      await this.prospectsRepo.softDelete(prospect.id);
    }
  }
}

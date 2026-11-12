import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import {
  DataSource,
  EntityManager,
  IsNull,
  LessThan,
  Not,
  Repository,
} from 'typeorm';
import { Prospect } from './entities/prospect.entity';
import { Client } from '../clients/entities/client.entity';
import { Role, StatutClient, StatutKanban, TypeEntite } from '../common/enums';
import { AuditAction, AuditLog } from '../audit/entities/audit-log.entity';
import { User } from '../users/entities/user.entity';
import { Mission } from '../missions/entities/mission.entity';
import { LettreMission } from '../lettres-mission/entities/lettre-mission.entity';
import { PlanningEtape } from '../planning/entities/planning-etape.entity';
import { Obligation } from '../obligations/entities/obligation.entity';
import { Document } from '../documents/entities/document.entity';
import { BeneficiaireEffectif } from '../beneficiaires/entities/beneficiaire-effectif.entity';
import {
  QuestionnaireAcceptation,
  StatutQuestionnaire,
} from '../questionnaires/entities/questionnaire-acceptation.entity';
import { ScoreRisque } from '../scoring/entities/score-risque.entity';
import { CreateProspectDto } from './dto/create-prospect.dto';
import { UpdateProspectDto } from './dto/update-prospect.dto';
import { generateNextRef } from '../common/generate-ref';
import { nomDossier } from '../common/storage';
import { ScoringService } from '../scoring/scoring.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ObligationsService } from '../obligations/obligations.service';

type AuthUser = { id: string; role: Role };

// Déplacement à effectuer dans le dossier local de l'utilisateur après une
// conversion (Prospects/<Réf> <Nom>/… → Clients/<Réf> <Nom>/…).
export interface DeplacementDocument {
  de: string;
  vers: string;
}

export type ClientConverti = Client & {
  deplacementsDocuments: DeplacementDocument[];
};

// Champs modifiables via PATCH (le reste passe par des actions dédiées :
// refus, conversion, assignation).
const CHAMPS_MODIFIABLES = [
  'nom',
  'email',
  'telephone',
  'typeEntite',
  'formeJuridique',
  'representantLegal',
  'siret',
  'activite',
  'codeNaf',
  'adresse',
  'ville',
  'codePostal',
  'pays',
  'notes',
  'chiffreAffaires',
  'effectif',
  'capitalSocial',
  'regimeFiscal',
  'regimeTva',
  'tvaIntracommunautaire',
  'existenceSalaries',
  'conventionCollective',
] as const;

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
    private readonly obligationsService: ObligationsService,
  ) {}

  private audit(
    manager: EntityManager | null,
    action: AuditAction,
    ressource: string,
    ressourceId: string,
    details: Record<string, unknown> | null,
    userId: string,
  ): Promise<AuditLog> {
    const repo = manager ? manager.getRepository(AuditLog) : this.auditRepo;
    return repo.save(
      repo.create({
        action,
        ressource,
        ressourceId,
        details,
        utilisateur: { id: userId } as User,
      }),
    );
  }

  // Empêche de créer deux fois la même entreprise : un SIRET déjà porté par
  // un prospect actif (non archivé) ou par un client bloque la saisie, avec
  // la référence existante dans le message pour la retrouver.
  private async assertSiretDisponible(
    siret: string | null | undefined,
    exceptProspectId?: string,
  ): Promise<void> {
    if (!siret) return;
    const prospect = await this.prospectsRepo.findOne({
      where: { siret },
      select: { id: true, ref: true, nom: true },
    });
    if (prospect && prospect.id !== exceptProspectId) {
      throw new ConflictException(
        `Ce SIRET est déjà utilisé par le prospect ${prospect.ref} (${prospect.nom})`,
      );
    }
    const client = await this.dataSource.getRepository(Client).findOne({
      where: { siret },
      select: { id: true, ref: true, raisonSociale: true },
    });
    if (client) {
      throw new ConflictException(
        `Ce SIRET est déjà utilisé par le client ${client.ref} (${client.raisonSociale})`,
      );
    }
  }

  // Règles de complétude : SIRET obligatoire pour une personne morale, et au
  // moins un moyen de contact (email ou téléphone).
  private assertChampsObligatoires(p: {
    typeEntite: TypeEntite;
    siret?: string | null;
    email?: string | null;
    telephone?: string | null;
  }): void {
    if (p.typeEntite === TypeEntite.PERSONNE_MORALE && !p.siret) {
      throw new BadRequestException(
        'Le SIRET est obligatoire pour une personne morale',
      );
    }
    if (!p.email && !p.telephone) {
      throw new BadRequestException(
        'Renseignez au moins un email ou un téléphone',
      );
    }
  }

  async create(dto: CreateProspectDto, authUser: AuthUser): Promise<Prospect> {
    this.assertChampsObligatoires(dto);
    await this.assertSiretDisponible(dto.siret);
    const { assignedToId, ...champs } = dto;

    const saved = await this.dataSource.transaction(async (manager) => {
      const year = new Date().getFullYear();
      const ref = await generateNextRef(manager, Prospect, `QWP-${year}-`);

      const created = await manager.save(
        manager.create(Prospect, {
          ...champs,
          ref,
          createdBy: { id: authUser.id } as User,
          assignedTo: assignedToId ? ({ id: assignedToId } as User) : null,
        }),
      );

      await this.audit(
        manager,
        AuditAction.CREATE,
        'Prospect',
        created.id,
        { ref, nom: created.nom, assignedToId: assignedToId ?? null },
        authUser.id,
      );
      return created;
    });

    if (assignedToId && assignedToId !== authUser.id) {
      await this.notificationsService.creerPour(
        [assignedToId],
        'Prospect assigné',
        saved.nom,
        `/dashboard/prospects/${saved.id}`,
      );
    }
    return saved;
  }

  // Pipeline actif : tout prospect non converti en client et non archivé.
  // Lecture ouverte à tous les rôles (un collaborateur doit pouvoir repérer
  // un prospect non assigné pour se l'approprier).
  async findAll(): Promise<Prospect[]> {
    return this.prospectsRepo
      .createQueryBuilder('prospect')
      .leftJoinAndSelect('prospect.createdBy', 'createdBy')
      .leftJoinAndSelect('prospect.assignedTo', 'assignedTo')
      .leftJoinAndSelect('prospect.client', 'client')
      .where('client.id IS NULL')
      .orderBy('prospect.createdAt', 'DESC')
      .getMany();
  }

  // Prospects archivés (refusés depuis plus de 7 jours, ou supprimés) :
  // consultables et réactivables.
  async findArchives(): Promise<Prospect[]> {
    return this.prospectsRepo.find({
      where: { deletedAt: Not(IsNull()) },
      withDeleted: true,
      relations: ['createdBy', 'assignedTo'],
      order: { deletedAt: 'DESC' },
    });
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
  // (ou pas encore assignés, pour pouvoir se les approprier).
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

    if (prospect.client) {
      throw new BadRequestException(
        'Ce prospect est converti : modifiez désormais la fiche client',
      );
    }
    if (dto.statutKanban === StatutKanban.CONVERTI) {
      throw new BadRequestException(
        'Utilisez « Convertir en client » : le statut Converti ne se pose pas à la main',
      );
    }
    if (
      dto.statutKanban === StatutKanban.REFUSE &&
      prospect.statutKanban !== StatutKanban.REFUSE
    ) {
      throw new BadRequestException(
        'Utilisez « Refuser le prospect » : un motif de refus est obligatoire',
      );
    }

    const { assignedToId, statutKanban } = dto;
    for (const champ of CHAMPS_MODIFIABLES) {
      if (dto[champ] !== undefined) {
        (prospect as unknown as Record<string, unknown>)[champ] = dto[champ];
      }
    }
    this.assertChampsObligatoires(prospect);
    if (dto.siret) await this.assertSiretDisponible(dto.siret, prospect.id);

    const previousAssignedToId = prospect.assignedTo?.id ?? null;
    if (assignedToId !== undefined) {
      prospect.assignedTo = assignedToId
        ? ({ id: assignedToId } as User)
        : null;
    }
    // Sortie du statut Refusé (carte glissée vers une autre colonne) : le
    // prospect reprend sa progression ; le motif reste dans l'audit.
    if (statutKanban !== undefined) {
      if (
        prospect.statutKanban === StatutKanban.REFUSE &&
        statutKanban !== StatutKanban.REFUSE
      ) {
        prospect.refusedAt = null;
        prospect.motifRefus = null;
      }
      prospect.statutKanban = statutKanban;
    }
    const saved = await this.prospectsRepo.save(prospect);

    await this.audit(
      null,
      AuditAction.UPDATE,
      'Prospect',
      id,
      dto as Record<string, unknown>,
      authUser.id,
    );

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

  async refuser(
    id: string,
    motif: string,
    authUser: AuthUser,
  ): Promise<Prospect> {
    const prospect = await this.findOne(id);
    if (prospect.client) {
      throw new BadRequestException('Un prospect converti ne peut être refusé');
    }
    if (prospect.statutKanban === StatutKanban.REFUSE) {
      throw new BadRequestException('Ce prospect est déjà refusé');
    }
    prospect.statutKanban = StatutKanban.REFUSE;
    prospect.motifRefus = motif.trim();
    prospect.refusedAt = new Date();
    const saved = await this.prospectsRepo.save(prospect);

    await this.audit(
      null,
      AuditAction.UPDATE,
      'Prospect',
      id,
      { statutKanban: StatutKanban.REFUSE, motifRefus: prospect.motifRefus },
      authUser.id,
    );
    return saved;
  }

  // Remet un prospect archivé (ou refusé) dans le pipeline, en « Prise de
  // contact ». Son SIRET ne doit pas avoir été repris entre-temps.
  async reactiver(id: string, authUser: AuthUser): Promise<Prospect> {
    const prospect = await this.prospectsRepo.findOne({
      where: { id },
      withDeleted: true,
      relations: ['client'],
    });
    if (!prospect) throw new NotFoundException('Prospect introuvable');
    if (prospect.client) {
      throw new BadRequestException('Ce prospect a été converti en client');
    }
    await this.assertSiretDisponible(prospect.siret, prospect.id);

    const motifPrecedent = prospect.motifRefus;
    if (prospect.deletedAt) await this.prospectsRepo.restore(id);
    await this.prospectsRepo.update(id, {
      statutKanban: StatutKanban.PRISE_CONTACT,
      refusedAt: null,
      motifRefus: null,
    });

    await this.audit(
      null,
      AuditAction.UPDATE,
      'Prospect',
      id,
      { event: 'REACTIVATION', motifRefusPrecedent: motifPrecedent },
      authUser.id,
    );
    return this.findOne(id);
  }

  // Conditions de conversion (cf. docs/projet/decisions-revue-2026-11.md) :
  // questionnaire validé, au moins une lettre de mission signée par l'EC ET
  // par le client, un bénéficiaire effectif pour une personne morale.
  // Renvoie la liste des conditions non remplies (vide = convertible).
  async conditionsConversion(
    id: string,
    manager: EntityManager = this.dataSource.manager,
  ): Promise<string[]> {
    const prospect = await manager.findOne(Prospect, {
      where: { id },
      relations: ['questionnaire', 'client'],
    });
    if (!prospect) throw new NotFoundException('Prospect introuvable');

    if (prospect.client) return ['Ce prospect est déjà converti'];
    const manquants: string[] = [];
    if (prospect.statutKanban === StatutKanban.REFUSE) {
      manquants.push('Le prospect est refusé');
    }
    if (prospect.questionnaire?.statut !== StatutQuestionnaire.VALIDE) {
      manquants.push('Le questionnaire d’acceptation doit être validé');
    }
    const lettresSignees = await manager
      .getRepository(LettreMission)
      .createQueryBuilder('l')
      .innerJoin('l.mission', 'm')
      .where('m.id_prospect = :id', { id })
      .andWhere('l.signeeParExpert = true')
      .andWhere('l.signeeParClientAt IS NOT NULL')
      .getCount();
    if (lettresSignees === 0) {
      manquants.push(
        'Au moins une lettre de mission doit être signée par l’expert-comptable et par le client',
      );
    }
    if (prospect.typeEntite === TypeEntite.PERSONNE_MORALE) {
      const ubos = await manager.count(BeneficiaireEffectif, {
        where: { prospect: { id } },
      });
      if (ubos === 0) {
        manquants.push('Au moins un bénéficiaire effectif doit être saisi');
      }
    }
    return manquants;
  }

  // Convertit le prospect en client et lui transfère TOUT son dossier.
  async convertToClient(
    id: string,
    authUser: AuthUser,
  ): Promise<ClientConverti> {
    const { client, deplacements } = await this.dataSource.transaction(
      async (manager) => {
        // Verrou sur la ligne : deux clics simultanés ne créent pas deux
        // clients (le second attend puis voit le prospect déjà converti).
        const verrou: unknown[] = await manager.query(
          'SELECT id FROM prospects WHERE id = $1 AND "deletedAt" IS NULL FOR UPDATE',
          [id],
        );
        if (verrou.length === 0) {
          throw new NotFoundException('Prospect introuvable');
        }
        const manquants = await this.conditionsConversion(id, manager);
        if (manquants.length > 0) {
          throw new BadRequestException(
            `Conversion impossible : ${manquants.join(' · ')}`,
          );
        }
        const prospect = await manager.findOneOrFail(Prospect, {
          where: { id },
          relations: ['questionnaire'],
        });

        // PPE : champ KYC du client, déduit de la réponse D1_11 du
        // questionnaire ou d'un bénéficiaire effectif PPE.
        const reponses = prospect.questionnaire?.reponses as
          | Record<string, unknown>
          | undefined;
        const uboPpe = await manager.count(BeneficiaireEffectif, {
          where: { prospect: { id }, ppe: true },
        });
        const ppe = reponses?.['D1_11'] === 'oui' || uboPpe > 0;

        const year = new Date().getFullYear();
        const ref = await generateNextRef(manager, Client, `QW-${year}-`);
        const client = await manager.save(
          manager.create(Client, {
            ref,
            raisonSociale: prospect.nom,
            typeEntite: prospect.typeEntite,
            siret: prospect.siret,
            siren: prospect.siret ? prospect.siret.slice(0, 9) : null,
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
            capitalSocial: prospect.capitalSocial,
            regimeFiscal: prospect.regimeFiscal,
            regimeTva: prospect.regimeTva,
            tvaIntracommunautaire: prospect.tvaIntracommunautaire,
            existenceSalaries: prospect.existenceSalaries,
            conventionCollective: prospect.conventionCollective,
            notes: prospect.notes,
            ppe,
            statut: StatutClient.ACTIF,
            createdBy: { id: authUser.id } as User,
          }),
        );
        const versClient = { client: { id: client.id } };

        // Rattachements exclusifs (client OU prospect) : on bascule.
        for (const entite of [
          Mission,
          PlanningEtape,
          Obligation,
          BeneficiaireEffectif,
        ]) {
          await manager
            .createQueryBuilder()
            .update(entite)
            .set({ ...versClient, prospect: null })
            .where('id_prospect = :id', { id })
            .execute();
        }
        // Historique conservé côté prospect, rattaché en plus au client.
        for (const entite of [QuestionnaireAcceptation, ScoreRisque]) {
          await manager
            .createQueryBuilder()
            .update(entite)
            .set(versClient)
            .where('id_prospect = :id', { id })
            .execute();
        }
        const ubos = await manager.count(BeneficiaireEffectif, {
          where: { client: { id: client.id } },
        });
        await manager.update(Client, client.id, { uboSaisi: ubos > 0 });
        client.uboSaisi = ubos > 0;

        // Documents : rattachés au client et rangés dans Clients/<Réf> <Nom>/.
        const deplacements: DeplacementDocument[] = [];
        const docs = await manager.find(Document, {
          where: { prospect: { id } },
          withDeleted: true,
        });
        const dossierClient = nomDossier(client.ref, client.raisonSociale);
        for (const doc of docs) {
          const ancien = doc.cheminRelatif;
          const nouveau = ancien
            ? ['Clients', dossierClient, ...ancien.split('/').slice(2)].join(
                '/',
              )
            : null;
          await manager.update(Document, doc.id, {
            ...versClient,
            prospect: null,
            cheminRelatif: nouveau,
          });
          if (ancien && nouveau && !doc.deletedAt) {
            deplacements.push({ de: ancien, vers: nouveau });
          }
        }

        await manager.update(Prospect, id, {
          statutKanban: StatutKanban.CONVERTI,
          client: { id: client.id },
        });

        await this.audit(
          manager,
          AuditAction.CREATE,
          'Client',
          client.id,
          { ref, convertedFromProspect: id, prospectRef: prospect.ref },
          authUser.id,
        );
        await this.audit(
          manager,
          AuditAction.UPDATE,
          'Prospect',
          id,
          { statutKanban: StatutKanban.CONVERTI, clientId: client.id },
          authUser.id,
        );
        return { client, deplacements };
      },
    );

    await this.scoringService.recalculateForClient(client.id, authUser.id);
    await this.obligationsService.synchroniserPourClient(client.id);

    return Object.assign(client, { deplacementsDocuments: deplacements });
  }

  async remove(id: string, authUser: AuthUser): Promise<void> {
    const prospect = await this.findOne(id);
    // Un COLLABORATEUR ne supprime que ce qu'il a lui-même créé (fausse
    // manip) ; RESPONSABLE, EXPERT_COMPTABLE et ADMIN suppriment tout.
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
    await this.audit(
      null,
      AuditAction.DELETE,
      'Prospect',
      id,
      { nom: prospect.nom },
      authUser.id,
    );
  }

  // Job quotidien : les prospects refusés depuis plus de 7 jours sont
  // archivés (soft-delete) pour désencombrer le kanban. Ils restent
  // consultables et réactivables depuis la page « Prospects archivés ».
  @Cron(CronExpression.EVERY_DAY_AT_4AM)
  async archiverProspectsRefuses(): Promise<void> {
    const limite = new Date();
    limite.setDate(limite.getDate() - 7);

    const expires = await this.prospectsRepo.find({
      where: {
        statutKanban: StatutKanban.REFUSE,
        refusedAt: LessThan(limite),
      },
      relations: ['createdBy'],
    });

    for (const prospect of expires) {
      await this.prospectsRepo.softDelete(prospect.id);
      // Action système : imputée au créateur du prospect faute d'utilisateur.
      await this.audit(
        null,
        AuditAction.DELETE,
        'Prospect',
        prospect.id,
        { event: 'ARCHIVAGE_AUTO_REFUS', motifRefus: prospect.motifRefus },
        prospect.createdBy.id,
      );
    }
  }
}

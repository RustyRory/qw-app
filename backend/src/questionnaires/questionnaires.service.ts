import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  QuestionnaireAcceptation,
  StatutQuestionnaire,
} from './entities/questionnaire-acceptation.entity';
import { Prospect } from '../prospects/entities/prospect.entity';
import { User } from '../users/entities/user.entity';
import { ScoringService } from '../scoring/scoring.service';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '../audit/entities/audit-log.entity';
import { PlanningService } from '../planning/planning.service';
import { ObligationsService } from '../obligations/obligations.service';
import { NotificationsService } from '../notifications/notifications.service';
import { Role, StatutKanban, TypeObligation } from '../common/enums';
import {
  avancerStatutKanban,
  refuserProspectAuto,
} from '../common/prospect-kanban.util';
import { CreateQuestionnaireDto } from './dto/create-questionnaire.dto';
import { UpdateQuestionnaireDto } from './dto/update-questionnaire.dto';

const ETAPE_QUESTIONNAIRE_A_REMPLIR = 'Questionnaire à remplir';

@Injectable()
export class QuestionnairesService {
  constructor(
    @InjectRepository(QuestionnaireAcceptation)
    private readonly repo: Repository<QuestionnaireAcceptation>,
    @InjectRepository(Prospect)
    private readonly prospectRepo: Repository<Prospect>,
    private readonly scoringService: ScoringService,
    private readonly auditService: AuditService,
    private readonly planningService: PlanningService,
    private readonly obligationsService: ObligationsService,
    private readonly notificationsService: NotificationsService,
  ) {}

  // Notifie le collaborateur en charge du prospect (assigné, ou créateur à
  // défaut) qu'une action lui incombe pour continuer le pipeline LAB.
  private async notifierCollaborateurAssigne(
    prospectId: string,
    titre: string,
    lien: string,
  ): Promise<void> {
    const prospect = await this.prospectRepo.findOne({
      where: { id: prospectId },
      relations: ['assignedTo', 'createdBy'],
    });
    if (!prospect) return;
    const destinataireId = prospect.assignedTo?.id ?? prospect.createdBy.id;
    await this.notificationsService.creerPour(
      [destinataireId],
      titre,
      prospect.nom,
      lien,
    );
  }

  async create(
    dto: CreateQuestionnaireDto,
    userId: string,
  ): Promise<QuestionnaireAcceptation> {
    const existing = await this.repo.findOne({
      where: { prospect: { id: dto.prospectId } },
    });
    if (existing) {
      throw new BadRequestException(
        'Un questionnaire existe déjà pour ce prospect',
      );
    }
    const q = this.repo.create({
      prospect: { id: dto.prospectId } as Prospect,
      reponses: dto.reponses ?? null,
      createdBy: { id: userId } as User,
    });
    const saved = await this.repo.save(q);

    await this.scoringService.recalculateForProspect(dto.prospectId, userId);
    await this.planningService.ouvrirEtapePourProspect(
      dto.prospectId,
      ETAPE_QUESTIONNAIRE_A_REMPLIR,
    );
    await this.obligationsService.ouvrirPourProspect(
      dto.prospectId,
      TypeObligation.VALIDATION_RELATION,
    );
    await this.notifierCollaborateurAssigne(
      dto.prospectId,
      'Questionnaire à remplir',
      `/dashboard/prospects/${dto.prospectId}/questionnaire`,
    );

    return saved;
  }

  findByProspect(prospectId: string): Promise<QuestionnaireAcceptation | null> {
    return this.repo.findOne({
      where: { prospect: { id: prospectId } },
      relations: ['prospect', 'createdBy', 'validatedBy'],
    });
  }

  async findOne(id: string): Promise<QuestionnaireAcceptation> {
    const q = await this.repo.findOne({
      where: { id },
      relations: ['prospect', 'createdBy', 'validatedBy'],
    });
    if (!q) throw new NotFoundException('Questionnaire introuvable');
    return q;
  }

  async updateReponses(
    id: string,
    dto: UpdateQuestionnaireDto,
    userId: string,
  ): Promise<QuestionnaireAcceptation> {
    const q = await this.repo.findOne({
      where: { id },
      relations: ['prospect'],
    });
    if (!q) throw new NotFoundException('Questionnaire introuvable');
    if (q.statut !== StatutQuestionnaire.EN_COURS) {
      throw new BadRequestException(
        'Seul un questionnaire en cours peut être modifié',
      );
    }
    if (dto.reponses !== undefined) q.reponses = dto.reponses;
    const saved = await this.repo.save(q);

    await this.scoringService.recalculateForProspect(q.prospect.id, userId);

    return saved;
  }

  // Signale que le collaborateur a fini de renseigner le questionnaire :
  // fait avancer le prospect en VALIDATION_LAB (sans jamais le faire
  // régresser) et notifie RESPONSABLE/EXPERT_COMPTABLE qu'une validation est
  // attendue — jusqu'ici ce statut n'était posé qu'à la main sur le Kanban.
  async marquerComplete(id: string): Promise<QuestionnaireAcceptation> {
    const q = await this.repo.findOne({
      where: { id },
      relations: ['prospect'],
    });
    if (!q) throw new NotFoundException('Questionnaire introuvable');
    if (q.statut !== StatutQuestionnaire.EN_COURS) {
      throw new BadRequestException(
        'Seul un questionnaire en cours peut être signalé comme complété',
      );
    }

    if (avancerStatutKanban(q.prospect, StatutKanban.VALIDATION_LAB)) {
      await this.prospectRepo.save(q.prospect);
    }

    await this.planningService.fermerEtapePourProspect(
      q.prospect.id,
      ETAPE_QUESTIONNAIRE_A_REMPLIR,
    );

    await this.notificationsService.creerPourRoles(
      [Role.RESPONSABLE, Role.EXPERT_COMPTABLE],
      'Questionnaire à valider',
      q.prospect.nom,
      `/dashboard/prospects/${q.prospect.id}/questionnaire`,
    );

    return q;
  }

  async validate(
    id: string,
    userId: string,
  ): Promise<QuestionnaireAcceptation> {
    const q = await this.repo.findOne({
      where: { id },
      relations: ['prospect'],
    });
    if (!q) throw new NotFoundException('Questionnaire introuvable');
    if (q.statut !== StatutQuestionnaire.EN_COURS) {
      throw new BadRequestException(
        'Seul un questionnaire en cours peut être validé',
      );
    }
    q.statut = StatutQuestionnaire.VALIDE;
    q.validatedAt = new Date();
    q.validatedBy = { id: userId } as User;
    const saved = await this.repo.save(q);

    // Automatisation : un LAB validé fait avancer le prospect en LM_A_FAIRE
    // (sans jamais le faire régresser s'il est déjà plus loin dans le pipeline).
    if (avancerStatutKanban(q.prospect, StatutKanban.LM_A_FAIRE)) {
      await this.prospectRepo.save(q.prospect);
    }

    await this.planningService.fermerEtapePourProspect(
      q.prospect.id,
      ETAPE_QUESTIONNAIRE_A_REMPLIR,
    );
    await this.obligationsService.cloturerPourProspect(
      q.prospect.id,
      TypeObligation.VALIDATION_RELATION,
    );
    await this.obligationsService.ouvrirPourProspect(
      q.prospect.id,
      TypeObligation.LETTRE_MISSION,
    );
    await this.notifierCollaborateurAssigne(
      q.prospect.id,
      'Lettre de mission à créer',
      `/dashboard/prospects/${q.prospect.id}`,
    );

    return saved;
  }

  async refuse(
    id: string,
    motif: string,
    userId: string,
  ): Promise<QuestionnaireAcceptation> {
    if (!motif?.trim()) {
      throw new BadRequestException('Le motif de refus est obligatoire');
    }
    const q = await this.repo.findOne({
      where: { id },
      relations: ['prospect'],
    });
    if (!q) throw new NotFoundException('Questionnaire introuvable');
    if (q.statut !== StatutQuestionnaire.EN_COURS) {
      throw new BadRequestException(
        'Seul un questionnaire en cours peut être refusé',
      );
    }
    q.statut = StatutQuestionnaire.REFUSE;
    q.motifRefus = motif.trim();
    q.validatedAt = new Date();
    q.validatedBy = { id: userId } as User;
    const saved = await this.repo.save(q);

    // Automatisation : un LAB refusé bascule le prospect en REFUSE dans le
    // kanban, plus besoin d'une action séparée pour que ça se voie.
    if (refuserProspectAuto(q.prospect)) {
      // Le motif du refus LAB devient le motif de refus du prospect.
      q.prospect.motifRefus = q.motifRefus;
      await this.prospectRepo.save(q.prospect);
    }

    await this.planningService.fermerEtapePourProspect(
      q.prospect.id,
      ETAPE_QUESTIONNAIRE_A_REMPLIR,
    );
    await this.obligationsService.cloturerPourProspect(
      q.prospect.id,
      TypeObligation.VALIDATION_RELATION,
    );

    return saved;
  }

  // Rouvre un questionnaire validé/refusé pour la reprise annuelle LAB.
  // L'ancien état (réponses, décision, auteur) est conservé dans l'audit log
  // avant d'être réinitialisé, pour garder une trace en cas de contrôle.
  async reopen(id: string, userId: string): Promise<QuestionnaireAcceptation> {
    const q = await this.repo.findOne({
      where: { id },
      relations: ['prospect', 'validatedBy'],
    });
    if (!q) throw new NotFoundException('Questionnaire introuvable');
    if (q.statut === StatutQuestionnaire.EN_COURS) {
      throw new BadRequestException(
        'Ce questionnaire est déjà en cours de modification',
      );
    }

    await this.auditService.log(
      userId,
      AuditAction.UPDATE,
      'Questionnaire',
      q.id,
      {
        event: 'REOPEN',
        statutPrecedent: q.statut,
        reponsesPrecedentes: q.reponses,
        motifRefusPrecedent: q.motifRefus,
        validatedAtPrecedent: q.validatedAt,
        validatedByIdPrecedent: q.validatedBy?.id ?? null,
      },
    );

    q.statut = StatutQuestionnaire.EN_COURS;
    q.motifRefus = null;
    q.validatedAt = null;
    q.validatedBy = null;
    const saved = await this.repo.save(q);

    await this.scoringService.recalculateForProspect(q.prospect.id, userId);
    await this.planningService.ouvrirEtapePourProspect(
      q.prospect.id,
      ETAPE_QUESTIONNAIRE_A_REMPLIR,
    );
    await this.obligationsService.ouvrirPourProspect(
      q.prospect.id,
      TypeObligation.VALIDATION_RELATION,
    );

    return saved;
  }
}

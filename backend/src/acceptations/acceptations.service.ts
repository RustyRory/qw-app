import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  AcceptationMission,
  StatutAcceptation,
} from './entities/acceptation-mission.entity';
import {
  CATALOGUE_ACCEPTATION,
  ReponseAcceptation,
  questionsSansReponse,
} from './catalogue';
import { User } from '../users/entities/user.entity';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '../audit/entities/audit-log.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { ObligationsService } from '../obligations/obligations.service';
import { Role } from '../common/enums';

export type CibleAcceptation = 'prospect' | 'client';

const QUESTIONS_VALIDES = new Set(
  CATALOGUE_ACCEPTATION.flatMap((s) => s.questions.map((q) => q.id)),
);

function nettoyer(
  reponses: Record<string, ReponseAcceptation>,
): Record<string, ReponseAcceptation> {
  const propre: Record<string, ReponseAcceptation> = {};
  for (const [id, r] of Object.entries(reponses ?? {})) {
    if (!QUESTIONS_VALIDES.has(id) || !r || typeof r !== 'object') continue;
    propre[id] = {
      reponse: r.reponse === 'oui' || r.reponse === 'non' ? r.reponse : null,
      niveau:
        r.niveau === 'E' || r.niveau === 'M' || r.niveau === 'F'
          ? r.niveau
          : null,
      observation:
        typeof r.observation === 'string' ? r.observation.slice(0, 2000) : null,
    };
  }
  return propre;
}

@Injectable()
export class AcceptationsService {
  constructor(
    @InjectRepository(AcceptationMission)
    private readonly repo: Repository<AcceptationMission>,
    private readonly auditService: AuditService,
    private readonly notificationsService: NotificationsService,
    private readonly obligationsService: ObligationsService,
  ) {}

  catalogue() {
    return CATALOGUE_ACCEPTATION;
  }

  findPour(
    cible: CibleAcceptation,
    id: string,
  ): Promise<AcceptationMission | null> {
    return this.repo.findOne({
      where: cible === 'client' ? { client: { id } } : { prospect: { id } },
      relations: ['decideePar', 'rempliPar', 'prospect', 'client'],
      order: { createdAt: 'DESC' },
    });
  }

  private async synchroniser(a: AcceptationMission): Promise<void> {
    if (a.client) {
      await this.obligationsService.synchroniserPourClient(a.client.id);
    } else if (a.prospect) {
      await this.obligationsService.synchroniserPourProspect(a.prospect.id);
    }
  }

  async enregistrer(
    cible: CibleAcceptation,
    id: string,
    reponses: Record<string, ReponseAcceptation>,
    userId: string,
  ): Promise<AcceptationMission> {
    let a = await this.findPour(cible, id);
    if (a?.statut === StatutAcceptation.ACCEPTEE) {
      throw new BadRequestException(
        'La mission a déjà été acceptée : rouvrez le questionnaire pour le modifier',
      );
    }
    if (!a) {
      a = this.repo.create({
        prospect: cible === 'prospect' ? { id } : null,
        client: cible === 'client' ? { id } : null,
      });
    }
    a.reponses = nettoyer(reponses);
    a.rempliPar = { id: userId } as User;
    const saved = await this.repo.save(a);
    await this.synchroniser(saved);
    return saved;
  }

  // Décision de l'expert-comptable (non délégable) : toutes les questions
  // doivent avoir une réponse (partie « maintien » comprise pour un client).
  async accepter(id: string, userId: string): Promise<AcceptationMission> {
    const a = await this.repo.findOne({
      where: { id },
      relations: ['prospect', 'client'],
    });
    if (!a) throw new NotFoundException('Questionnaire introuvable');
    if (a.statut === StatutAcceptation.ACCEPTEE) {
      throw new BadRequestException('La mission est déjà acceptée');
    }
    const manquantes = questionsSansReponse(a.reponses, !!a.client);
    if (manquantes.length > 0) {
      throw new BadRequestException(
        `Répondez à toutes les questions avant de décider (${manquantes.length} sans réponse)`,
      );
    }
    a.statut = StatutAcceptation.ACCEPTEE;
    a.decideeAt = new Date();
    a.decideePar = { id: userId } as User;
    const saved = await this.repo.save(a);
    await this.auditService.log(
      userId,
      AuditAction.VALIDATE,
      'AcceptationMission',
      id,
      { decision: 'ACCEPTEE', maintien: !!a.client },
    );
    await this.synchroniser(saved);
    return saved;
  }

  // Revue annuelle (maintien) : rouvre le questionnaire, réponses
  // précédentes conservées comme base et tracées dans l'audit.
  async rouvrir(id: string, userId: string): Promise<AcceptationMission> {
    const a = await this.repo.findOne({
      where: { id },
      relations: ['prospect', 'client'],
    });
    if (!a) throw new NotFoundException('Questionnaire introuvable');
    if (a.statut === StatutAcceptation.EN_COURS) {
      throw new BadRequestException('Ce questionnaire est déjà en cours');
    }
    await this.auditService.log(
      userId,
      AuditAction.UPDATE,
      'AcceptationMission',
      id,
      {
        event: 'REOPEN',
        reponsesPrecedentes: a.reponses,
        decideeAtPrecedente: a.decideeAt,
      },
    );
    a.statut = StatutAcceptation.EN_COURS;
    a.decideeAt = null;
    a.decideePar = null;
    const saved = await this.repo.save(a);
    await this.notificationsService.creerPourRoles(
      [Role.COLLABORATEUR, Role.RESPONSABLE],
      'Questionnaire de maintien de mission à compléter',
      null,
      a.client
        ? `/dashboard/clients/${a.client.id}/acceptation`
        : `/dashboard/prospects/${a.prospect?.id}`,
    );
    await this.synchroniser(saved);
    return saved;
  }

  // Utilisé avant la signature d'une lettre de mission.
  async estAcceptee(cible: {
    prospectId?: string | null;
    clientId?: string | null;
  }): Promise<boolean> {
    const a = cible.clientId
      ? await this.findPour('client', cible.clientId)
      : cible.prospectId
        ? await this.findPour('prospect', cible.prospectId)
        : null;
    return a?.statut === StatutAcceptation.ACCEPTEE;
  }
}

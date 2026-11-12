import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ScoreRisque } from './entities/score-risque.entity';
import { Client } from '../clients/entities/client.entity';
import { Prospect } from '../prospects/entities/prospect.entity';
import { BeneficiaireEffectif } from '../beneficiaires/entities/beneficiaire-effectif.entity';
import { QuestionnaireAcceptation } from '../questionnaires/entities/questionnaire-acceptation.entity';
import { User } from '../users/entities/user.entity';
import {
  flagsFromClient,
  flagsFromQuestionnaire,
  computeAutoScore,
} from './auto-score.util';
import { NiveauRisque } from '../common/enums';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '../audit/entities/audit-log.entity';

type AjustementSource = {
  niveauRisqueManuel: NiveauRisque | null;
  justificationNiveauManuel: string | null;
  niveauManuelAt: Date | null;
  niveauManuelPar: User | null;
};

function ajustementDe(e: AjustementSource) {
  if (!e.niveauRisqueManuel) return null;
  return {
    niveau: e.niveauRisqueManuel,
    justification: e.justificationNiveauManuel ?? '',
    par: e.niveauManuelPar
      ? `${e.niveauManuelPar.prenom} ${e.niveauManuelPar.nom}`
      : null,
    le: e.niveauManuelAt ? e.niveauManuelAt.toISOString() : null,
  };
}

@Injectable()
export class ScoringService {
  constructor(
    @InjectRepository(ScoreRisque)
    private readonly repo: Repository<ScoreRisque>,
    @InjectRepository(Client)
    private readonly clientRepo: Repository<Client>,
    @InjectRepository(Prospect)
    private readonly prospectRepo: Repository<Prospect>,
    @InjectRepository(BeneficiaireEffectif)
    private readonly beneficiaireRepo: Repository<BeneficiaireEffectif>,
    @InjectRepository(QuestionnaireAcceptation)
    private readonly questionnaireRepo: Repository<QuestionnaireAcceptation>,
    private readonly auditService: AuditService,
  ) {}

  // Calcul automatique du score d'un prospect à partir des réponses déjà
  // saisies dans son questionnaire d'acceptation — pas de saisie manuelle.
  async recalculateForProspect(
    prospectId: string,
    userId: string,
  ): Promise<ScoreRisque | null> {
    const prospect = await this.prospectRepo.findOne({
      where: { id: prospectId },
      relations: ['niveauManuelPar'],
    });
    if (!prospect) return null;
    const uboPpe = await this.beneficiaireRepo.exists({
      where: { prospect: { id: prospectId }, ppe: true },
    });

    const questionnaire = await this.questionnaireRepo.findOne({
      where: { prospect: { id: prospectId } },
    });

    const flags = flagsFromQuestionnaire(
      (questionnaire?.reponses as Record<string, unknown>) ?? {},
      prospect.typeEntite,
      uboPpe,
    );
    const { score, niveau, reponses } = computeAutoScore(
      { flags, chiffreAffaires: prospect.chiffreAffaires },
      ajustementDe(prospect),
    );

    return this.repo.save(
      this.repo.create({
        score,
        niveau,
        reponses,
        prospect: { id: prospectId } as Prospect,
        calculatedBy: { id: userId } as User,
      }),
    );
  }

  // Calcul automatique du score d'un client à partir de ses données réelles
  // (PPE, screening, bénéficiaires effectifs, CA) et, pour les critères sans
  // équivalent direct côté client, du questionnaire du prospect d'origine.
  async recalculateForClient(
    clientId: string,
    userId: string,
  ): Promise<ScoreRisque | null> {
    const client = await this.clientRepo.findOne({
      where: { id: clientId },
      relations: ['prospect', 'niveauManuelPar'],
    });
    if (!client) return null;

    const beneficiaires = await this.beneficiaireRepo.find({
      where: { client: { id: clientId } },
    });

    let questionnaireReponses: Record<string, unknown> | null = null;
    if (client.prospect) {
      const questionnaire = await this.questionnaireRepo.findOne({
        where: { prospect: { id: client.prospect.id } },
      });
      questionnaireReponses =
        (questionnaire?.reponses as Record<string, unknown>) ?? null;
    }

    const flags = flagsFromClient({
      ppe: client.ppe,
      typeEntite: client.typeEntite,
      screeningStatut: client.screeningStatut,
      beneficiaires,
      questionnaireReponses,
    });
    const { score, niveau, reponses } = computeAutoScore(
      { flags, chiffreAffaires: client.chiffreAffaires },
      ajustementDe(client),
    );

    return this.repo.save(
      this.repo.create({
        score,
        niveau,
        reponses,
        client: { id: clientId } as Client,
        calculatedBy: { id: userId } as User,
      }),
    );
  }

  findByClient(clientId: string): Promise<ScoreRisque[]> {
    return this.repo.find({
      where: { client: { id: clientId } },
      order: { createdAt: 'DESC' },
    });
  }

  async findCurrent(clientId: string): Promise<ScoreRisque | null> {
    return this.repo.findOne({
      where: { client: { id: clientId } },
      order: { createdAt: 'DESC' },
    });
  }

  findByProspect(prospectId: string): Promise<ScoreRisque[]> {
    return this.repo.find({
      where: { prospect: { id: prospectId } },
      order: { createdAt: 'DESC' },
    });
  }

  async findCurrentByProspect(prospectId: string): Promise<ScoreRisque | null> {
    return this.repo.findOne({
      where: { prospect: { id: prospectId } },
      order: { createdAt: 'DESC' },
    });
  }

  // Ajustement manuel (EC / admin) : justification obligatoire, tracé dans
  // l'audit ; null retire l'ajustement. Le niveau ne descend jamais sous un
  // « ÉLEVÉ d'office » (appliqué au calcul).
  async ajuster(
    cible: 'prospect' | 'client',
    id: string,
    niveau: NiveauRisque | null,
    justification: string | undefined,
    userId: string,
  ): Promise<ScoreRisque | null> {
    if (niveau && !justification?.trim()) {
      throw new BadRequestException('Une justification est obligatoire');
    }
    const repo = cible === 'prospect' ? this.prospectRepo : this.clientRepo;
    const existe = await repo.exists({ where: { id } });
    if (!existe) throw new NotFoundException('Dossier introuvable');
    await repo.update(id, {
      niveauRisqueManuel: niveau,
      justificationNiveauManuel: niveau ? justification!.trim() : null,
      niveauManuelAt: niveau ? new Date() : null,
      niveauManuelPar: niveau ? { id: userId } : null,
    });
    await this.auditService.log(
      userId,
      AuditAction.UPDATE,
      cible === 'prospect' ? 'Prospect' : 'Client',
      id,
      {
        event: 'AJUSTEMENT_NIVEAU_RISQUE',
        niveau,
        justification: justification ?? null,
      },
    );
    return cible === 'prospect'
      ? this.recalculateForProspect(id, userId)
      : this.recalculateForClient(id, userId);
  }
}

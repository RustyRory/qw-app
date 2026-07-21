import { Injectable } from '@nestjs/common';
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
  ) {}

  // Calcul automatique du score d'un prospect à partir des réponses déjà
  // saisies dans son questionnaire d'acceptation — pas de saisie manuelle.
  async recalculateForProspect(
    prospectId: string,
    userId: string,
  ): Promise<ScoreRisque | null> {
    const prospect = await this.prospectRepo.findOneBy({ id: prospectId });
    if (!prospect) return null;

    const questionnaire = await this.questionnaireRepo.findOne({
      where: { prospect: { id: prospectId } },
    });

    const flags = flagsFromQuestionnaire(
      (questionnaire?.reponses as Record<string, unknown>) ?? {},
      prospect.typeEntite,
    );
    const { score, niveau, reponses } = computeAutoScore({
      flags,
      chiffreAffaires: prospect.chiffreAffaires,
    });

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
      relations: ['prospect'],
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
    const { score, niveau, reponses } = computeAutoScore({
      flags,
      chiffreAffaires: client.chiffreAffaires,
    });

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
}

import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, LessThan, Repository } from 'typeorm';
import { Obligation } from './entities/obligation.entity';
import { Client } from '../clients/entities/client.entity';
import { Prospect } from '../prospects/entities/prospect.entity';
import { Document } from '../documents/entities/document.entity';
import {
  NiveauRisque,
  StatutObligation,
  StatutKyc,
  TypeDocument,
  TypeObligation,
} from '../common/enums';
import { BeneficiaireEffectif } from '../beneficiaires/entities/beneficiaire-effectif.entity';
import { ScoreRisque } from '../scoring/entities/score-risque.entity';
import {
  QuestionnaireAcceptation,
  StatutQuestionnaire,
} from '../questionnaires/entities/questionnaire-acceptation.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { Role } from '../common/enums';

// Revue annuelle du dossier client (KYC + questionnaire LAB) : rappel
// ouvert 30 jours avant la date anniversaire.
const DUREE_VALIDITE_REVUE_MOIS = 12;
const RAPPEL_REVUE_JOURS = 30;

function anniversaire(date: Date): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + DUREE_VALIDITE_REVUE_MOIS);
  return d;
}

function rappelDu(echeance: Date, maintenant: Date): boolean {
  const debut = new Date(echeance);
  debut.setDate(debut.getDate() - RAPPEL_REVUE_JOURS);
  return maintenant >= debut;
}
import { documentsManquants } from '../common/document-checklist';
import { CreateObligationDto } from './dto/create-obligation.dto';

const DELAI_ECHEANCE_AUTO_JOURS = 30;

@Injectable()
export class ObligationsService {
  constructor(
    @InjectRepository(Obligation)
    private readonly repo: Repository<Obligation>,
    @InjectRepository(Document)
    private readonly documentRepo: Repository<Document>,
    @InjectRepository(Client)
    private readonly clientRepo: Repository<Client>,
    @InjectRepository(BeneficiaireEffectif)
    private readonly beneficiaireRepo: Repository<BeneficiaireEffectif>,
    @InjectRepository(ScoreRisque)
    private readonly scoreRepo: Repository<ScoreRisque>,
    @InjectRepository(QuestionnaireAcceptation)
    private readonly questionnaireRepo: Repository<QuestionnaireAcceptation>,
    private readonly notificationsService: NotificationsService,
  ) {}

  create(dto: CreateObligationDto): Promise<Obligation> {
    if (!dto.clientId === !dto.prospectId) {
      throw new BadRequestException(
        'Renseignez soit clientId, soit prospectId (jamais les deux, ni aucun des deux)',
      );
    }
    const o = this.repo.create({
      client: dto.clientId ? { id: dto.clientId } : null,
      prospect: dto.prospectId ? { id: dto.prospectId } : null,
      type: dto.type,
      dateEcheance: dto.dateEcheance ? new Date(dto.dateEcheance) : null,
    });
    return this.repo.save(o);
  }

  findByClient(clientId: string): Promise<Obligation[]> {
    return this.repo.find({
      where: { client: { id: clientId } },
      order: { dateEcheance: 'ASC' },
    });
  }

  findByProspect(prospectId: string): Promise<Obligation[]> {
    return this.repo.find({
      where: { prospect: { id: prospectId } },
      order: { dateEcheance: 'ASC' },
    });
  }

  async marquerFait(id: string): Promise<Obligation> {
    const o = await this.repo.findOneBy({ id });
    if (!o) throw new NotFoundException('Obligation introuvable');
    if (
      o.statut === StatutObligation.FAIT ||
      o.statut === StatutObligation.EXPIRE
    ) {
      throw new BadRequestException(
        'Cette obligation est déjà clôturée et ne peut plus être marquée comme faite',
      );
    }
    o.statut = StatutObligation.FAIT;
    o.completedAt = new Date();
    return this.repo.save(o);
  }

  findEnRetard(): Promise<Obligation[]> {
    return this.repo.find({
      where: { statut: StatutObligation.EN_RETARD },
      order: { dateEcheance: 'ASC' },
      relations: ['client', 'prospect'],
    });
  }

  // Ouvre une obligation d'un type donné pour un prospect si aucune n'est
  // déjà ouverte (idempotent) — utilisé par le pipeline LAB → lettre de
  // mission (voir QuestionnairesService/LettresMissionService).
  async ouvrirPourProspect(
    prospectId: string,
    type: TypeObligation,
  ): Promise<void> {
    const ouverte = await this.repo.findOne({
      where: {
        prospect: { id: prospectId },
        type,
        statut: In([StatutObligation.A_FAIRE, StatutObligation.EN_RETARD]),
      },
    });
    if (ouverte) return;

    await this.repo.save(
      this.repo.create({
        prospect: { id: prospectId } as Prospect,
        type,
      }),
    );
  }

  // Clôture (FAIT) l'obligation ouverte d'un type donné pour un prospect,
  // si elle existe (idempotent, ne fait rien sinon).
  async cloturerPourProspect(
    prospectId: string,
    type: TypeObligation,
  ): Promise<void> {
    const ouverte = await this.repo.findOne({
      where: {
        prospect: { id: prospectId },
        type,
        statut: In([StatutObligation.A_FAIRE, StatutObligation.EN_RETARD]),
      },
    });
    if (!ouverte) return;

    ouverte.statut = StatutObligation.FAIT;
    ouverte.completedAt = new Date();
    await this.repo.save(ouverte);
  }

  // Détecte automatiquement, à partir de l'état courant du client, les
  // obligations qui doivent être ouvertes ou clôturées (documents
  // obligatoires manquants, KYC non validé). Appelé après upload/suppression
  // de document, mise à jour du client, et par le job quotidien.
  async synchroniserPourClient(clientId: string): Promise<void> {
    const client = await this.clientRepo.findOneBy({ id: clientId });
    if (!client) return;
    const maintenant = new Date();

    const manquants = await this.piecesManquantes(client);
    await this.syncType(
      clientId,
      TypeObligation.MISE_A_JOUR_DOCS,
      manquants.length > 0,
    );

    // KYC : à (re)faire s'il n'est pas validé, ou 30 jours avant son
    // expiration (1 an après la validation) ; expiré à la date anniversaire.
    let kycAOuvrir = client.kycStatut !== StatutKyc.VALIDE;
    let echeanceKyc: Date | undefined;
    if (client.kycStatut === StatutKyc.VALIDE && client.kycCompletedAt) {
      echeanceKyc = anniversaire(client.kycCompletedAt);
      if (echeanceKyc <= maintenant) {
        await this.clientRepo.update(clientId, { kycStatut: StatutKyc.EXPIRE });
        kycAOuvrir = true;
      } else if (rappelDu(echeanceKyc, maintenant)) {
        kycAOuvrir = true;
      }
    }
    await this.syncType(
      clientId,
      TypeObligation.KYC_VERIFICATION,
      kycAOuvrir,
      echeanceKyc,
    );

    // Questionnaire LAB : à refaire chaque année (rouvert depuis la fiche).
    const questionnaire = await this.questionnaireRepo.findOne({
      where: [{ client: { id: clientId } }],
    });
    let lab = false;
    let echeanceLab: Date | undefined;
    if (questionnaire?.statut === StatutQuestionnaire.VALIDE) {
      if (questionnaire.validatedAt) {
        echeanceLab = anniversaire(questionnaire.validatedAt);
        lab = rappelDu(echeanceLab, maintenant);
      }
    } else if (questionnaire?.statut === StatutQuestionnaire.EN_COURS) {
      lab = true; // rouvert pour la revue, pas encore revalidé
    }
    await this.syncType(
      clientId,
      TypeObligation.EVALUATION_RISQUE,
      lab,
      echeanceLab,
    );
  }

  // Pièces KYC obligatoires absentes ou expirées pour un client (PPE du
  // client ou d'un bénéficiaire effectif, risque ÉLEVÉ → pièces en plus).
  async piecesManquantes(client: Client): Promise<TypeDocument[]> {
    const [documents, uboPpe, score] = await Promise.all([
      this.documentRepo.find({
        where: { client: { id: client.id } },
        select: { id: true, type: true, dateExpiration: true },
      }),
      this.beneficiaireRepo.exists({
        where: { client: { id: client.id }, ppe: true },
      }),
      this.scoreRepo.findOne({
        where: { client: { id: client.id } },
        order: { createdAt: 'DESC' },
      }),
    ]);
    return documentsManquants(
      {
        typeEntite: client.typeEntite,
        ppe: client.ppe || uboPpe,
        risqueEleve: score?.niveau === NiveauRisque.ELEVE,
      },
      documents,
    );
  }

  private async syncType(
    clientId: string,
    type: TypeObligation,
    doitEtreOuverte: boolean,
    echeance?: Date,
  ): Promise<void> {
    const ouverte = await this.repo.findOne({
      where: {
        client: { id: clientId },
        type,
        statut: In([StatutObligation.A_FAIRE, StatutObligation.EN_RETARD]),
      },
    });

    if (doitEtreOuverte && !ouverte) {
      const dateEcheance = echeance ?? new Date();
      if (!echeance) {
        dateEcheance.setDate(
          dateEcheance.getDate() + DELAI_ECHEANCE_AUTO_JOURS,
        );
      }

      await this.repo.save(
        this.repo.create({
          client: { id: clientId } as Client,
          type,
          dateEcheance,
        }),
      );
    } else if (!doitEtreOuverte && ouverte) {
      ouverte.statut = StatutObligation.FAIT;
      ouverte.completedAt = new Date();
      await this.repo.save(ouverte);
    }
  }

  // Job quotidien : passe en retard les obligations dont l'échéance est
  // dépassée et prévient le collaborateur en charge, les responsables et
  // les experts-comptables.
  async marquerEnRetard(): Promise<void> {
    const enRetard = await this.repo.find({
      where: {
        statut: StatutObligation.A_FAIRE,
        dateEcheance: LessThan(new Date()),
      },
      relations: [
        'client',
        'client.createdBy',
        'prospect',
        'prospect.assignedTo',
        'prospect.createdBy',
      ],
    });
    for (const o of enRetard) {
      o.statut = StatutObligation.EN_RETARD;
      await this.repo.save(o);

      const nom = o.prospect?.nom ?? o.client?.raisonSociale ?? '';
      const lien = o.prospect
        ? `/dashboard/prospects/${o.prospect.id}`
        : `/dashboard/clients/${o.client?.id}?tab=obligations`;
      const titre = 'Obligation en retard';
      const enCharge =
        o.prospect?.assignedTo?.id ??
        o.prospect?.createdBy?.id ??
        o.client?.createdBy?.id;
      if (enCharge) {
        await this.notificationsService.creerPour([enCharge], titre, nom, lien);
      }
      await this.notificationsService.creerPourRoles(
        [Role.RESPONSABLE, Role.EXPERT_COMPTABLE],
        titre,
        nom,
        lien,
      );
    }
  }
}

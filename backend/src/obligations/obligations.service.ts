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
import {
  AcceptationMission,
  StatutAcceptation,
} from '../acceptations/entities/acceptation-mission.entity';
import { Role, StatutKanban, TypeEntite } from '../common/enums';

// Revue annuelle du dossier client (KYC + questionnaire LAB) : rappel
// ouvert 30 jours avant la date anniversaire.
const DUREE_VALIDITE_REVUE_MOIS = 12;
const RAPPEL_REVUE_JOURS = 30;

// Informations légales requises par la lettre de mission (mêmes règles
// que l'encart « À compléter » de la fiche prospect).
export function informationsManquantes(e: {
  typeEntite: TypeEntite;
  capitalSocial: number | null;
  regimeFiscal: string | null;
  regimeTva: string | null;
  tvaIntracommunautaire: string | null;
  existenceSalaries: boolean | null;
  conventionCollective: string | null;
  euid: string | null;
}): string[] {
  const manquants: string[] = [];
  const societe = e.typeEntite === TypeEntite.PERSONNE_MORALE;
  if (societe && e.capitalSocial == null) manquants.push('Capital social');
  if (!e.regimeFiscal) manquants.push('Régime fiscal');
  if (!e.regimeTva) manquants.push('Régime TVA');
  if (societe && !e.tvaIntracommunautaire) {
    manquants.push('N° TVA intracommunautaire');
  }
  if (societe && !e.euid) manquants.push('Numéro EUID');
  if (e.existenceSalaries == null) manquants.push('Existence de salariés');
  if (e.existenceSalaries !== false && !e.conventionCollective) {
    manquants.push('Convention collective');
  }
  return manquants;
}

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
    @InjectRepository(AcceptationMission)
    private readonly acceptationRepo: Repository<AcceptationMission>,
    @InjectRepository(Prospect)
    private readonly prospectRepo: Repository<Prospect>,
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

    // Questionnaires de maintien de mission (LAB + acceptation) : à
    // compléter chaque année par le collaborateur (rouverts depuis la fiche).
    const [questionnaire, acceptation] = await Promise.all([
      this.questionnaireRepo.findOne({ where: { client: { id: clientId } } }),
      this.acceptationRepo.findOne({
        where: { client: { id: clientId } },
        order: { createdAt: 'DESC' },
      }),
    ]);
    let maintien = false;
    let echeanceMaintien: Date | undefined;
    const revues: (Date | null | undefined)[] = [];
    if (questionnaire?.statut === StatutQuestionnaire.VALIDE) {
      revues.push(questionnaire.validatedAt);
    } else if (questionnaire) {
      maintien = true; // rouvert pour la revue, pas encore revalidé
    }
    if (acceptation?.statut === StatutAcceptation.ACCEPTEE) {
      revues.push(acceptation.decideeAt);
    } else {
      maintien = true; // jamais rempli, ou rouvert
    }
    for (const d of revues) {
      if (!d) continue;
      const e = anniversaire(d);
      if (!echeanceMaintien || e < echeanceMaintien) echeanceMaintien = e;
      if (rappelDu(e, maintenant)) maintien = true;
    }
    await this.syncType(
      clientId,
      TypeObligation.EVALUATION_RISQUE,
      maintien,
      echeanceMaintien,
    );
    await this.syncType(
      clientId,
      TypeObligation.INFORMATIONS_A_COMPLETER,
      informationsManquantes(client).length > 0,
    );
  }

  // Prospect en cours : informations légales et questionnaires (LAB,
  // acceptation de la mission) à compléter avant la lettre de mission.
  async synchroniserPourProspect(prospectId: string): Promise<void> {
    const prospect = await this.prospectRepo.findOne({
      where: { id: prospectId },
      relations: ['client'],
    });
    if (!prospect) return;
    const actif =
      !prospect.client && prospect.statutKanban !== StatutKanban.REFUSE;
    const [questionnaire, acceptation] = await Promise.all([
      this.questionnaireRepo.findOne({
        where: { prospect: { id: prospectId } },
      }),
      this.acceptationRepo.findOne({
        where: { prospect: { id: prospectId } },
        order: { createdAt: 'DESC' },
      }),
    ]);
    const questionnairesAFaire =
      questionnaire?.statut !== StatutQuestionnaire.VALIDE ||
      acceptation?.statut !== StatutAcceptation.ACCEPTEE;
    const cible = { prospectId };
    await this.syncType(
      cible,
      TypeObligation.INFORMATIONS_A_COMPLETER,
      actif && informationsManquantes(prospect).length > 0,
    );
    await this.syncType(
      cible,
      TypeObligation.QUESTIONNAIRES_A_COMPLETER,
      actif && questionnairesAFaire,
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
    cible: string | { prospectId: string },
    type: TypeObligation,
    doitEtreOuverte: boolean,
    echeance?: Date,
  ): Promise<void> {
    const sur =
      typeof cible === 'string'
        ? { client: { id: cible } }
        : { prospect: { id: cible.prospectId } };
    const ouverte = await this.repo.findOne({
      where: {
        ...sur,
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
          client: typeof cible === 'string' ? { id: cible } : null,
          prospect: typeof cible === 'string' ? null : { id: cible.prospectId },
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

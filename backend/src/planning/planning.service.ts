import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Not, Repository } from 'typeorm';
import { PlanningEtape } from './entities/planning-etape.entity';
import { Mission } from '../missions/entities/mission.entity';
import { Obligation } from '../obligations/entities/obligation.entity';
import { Client } from '../clients/entities/client.entity';
import { Prospect } from '../prospects/entities/prospect.entity';
import { User } from '../users/entities/user.entity';
import {
  StatutClient,
  StatutMission,
  StatutObligation,
  StatutPlanningEtape,
  TypePlanningEtape,
} from '../common/enums';
import { CreateEtapeDto } from './dto/create-etape.dto';
import { ObligationsService } from '../obligations/obligations.service';
import { TYPES_MISSION } from '../common/types-mission';
import type { EcheanceCalendrier } from './echeance-calendrier.interface';

const RENOUVELLEMENT_FENETRE_JOURS = 60;

const TYPE_MISSION_LABELS: Record<string, string> = Object.fromEntries(
  Object.entries(TYPES_MISSION).map(([k, v]) => [k, v.libelle]),
);

const TYPE_OBLIGATION_LABELS: Record<string, string> = {
  KYC_VERIFICATION: 'Vérification KYC',
  EVALUATION_RISQUE: 'Évaluation du risque',
  MISE_A_JOUR_DOCS: 'Mise à jour des documents',
  VALIDATION_RELATION: 'Questionnaire à valider',
  LETTRE_MISSION: 'Lettre de mission à faire',
  VALIDATION_LETTRE_MISSION: 'Lettre de mission à valider',
  SIGNATURE_LETTRE_MISSION: 'Lettre de mission à signer',
};

function joursRestants(date: Date): number {
  const msParJour = 24 * 60 * 60 * 1000;
  return Math.ceil((date.getTime() - Date.now()) / msParJour);
}

@Injectable()
export class PlanningService {
  constructor(
    @InjectRepository(PlanningEtape)
    private readonly repo: Repository<PlanningEtape>,
    @InjectRepository(Mission)
    private readonly missionRepo: Repository<Mission>,
    @InjectRepository(Obligation)
    private readonly obligationRepo: Repository<Obligation>,
    @InjectRepository(Client)
    private readonly clientRepo: Repository<Client>,
    @InjectRepository(Prospect)
    private readonly prospectRepo: Repository<Prospect>,
    private readonly obligationsService: ObligationsService,
  ) {}

  create(dto: CreateEtapeDto, userId: string): Promise<PlanningEtape> {
    if (!dto.clientId === !dto.prospectId) {
      throw new BadRequestException(
        'Renseignez soit clientId, soit prospectId (jamais les deux, ni aucun des deux)',
      );
    }
    const e = this.repo.create({
      client: dto.clientId ? { id: dto.clientId } : null,
      prospect: dto.prospectId ? { id: dto.prospectId } : null,
      titre: dto.titre,
      description: dto.description ?? null,
      type: dto.type,
      dateEcheance: dto.dateEcheance ? new Date(dto.dateEcheance) : null,
      assignedTo: dto.assignedToId ? { id: dto.assignedToId } : null,
      createdBy: { id: userId } as User,
    });
    return this.repo.save(e);
  }

  findByClient(clientId: string): Promise<PlanningEtape[]> {
    return this.repo.find({
      where: { client: { id: clientId } },
      order: { createdAt: 'DESC' },
    });
  }

  findByProspect(prospectId: string): Promise<PlanningEtape[]> {
    return this.repo.find({
      where: { prospect: { id: prospectId } },
      order: { createdAt: 'DESC' },
    });
  }

  async complete(id: string, userId: string): Promise<PlanningEtape> {
    const e = await this.repo.findOneBy({ id });
    if (!e) throw new NotFoundException('Étape de planning introuvable');
    if (
      e.statut === StatutPlanningEtape.FAIT ||
      e.statut === StatutPlanningEtape.ANNULEE
    ) {
      throw new BadRequestException(
        'Cette étape est déjà clôturée et ne peut plus être complétée',
      );
    }
    e.statut = StatutPlanningEtape.FAIT;
    e.completedAt = new Date();
    e.completedBy = { id: userId } as User;
    return this.repo.save(e);
  }

  async remove(id: string): Promise<void> {
    const e = await this.repo.findOneBy({ id });
    if (!e) throw new NotFoundException('Étape de planning introuvable');
    await this.repo.remove(e);
  }

  // Ouvre une étape (REGLEMENTAIRE, auto-générée) pour un prospect si aucune
  // du même titre n'est déjà ouverte (idempotent) — utilisé par le pipeline
  // LAB → lettre de mission (voir QuestionnairesService).
  async ouvrirEtapePourProspect(
    prospectId: string,
    titre: string,
  ): Promise<void> {
    const ouverte = await this.repo.findOne({
      where: {
        prospect: { id: prospectId },
        titre,
        statut: In([StatutPlanningEtape.A_FAIRE, StatutPlanningEtape.EN_COURS]),
      },
    });
    if (ouverte) return;

    const prospect = await this.prospectRepo.findOne({
      where: { id: prospectId },
      relations: ['assignedTo', 'createdBy'],
    });
    if (!prospect) return;

    await this.repo.save(
      this.repo.create({
        prospect: { id: prospectId } as Prospect,
        titre,
        type: TypePlanningEtape.REGLEMENTAIRE,
        assignedTo: prospect.assignedTo ?? null,
        createdBy: prospect.createdBy,
      }),
    );
  }

  // Clôture (FAIT) l'étape ouverte du même titre pour un prospect, si elle
  // existe (idempotent, ne fait rien sinon).
  async fermerEtapePourProspect(
    prospectId: string,
    titre: string,
  ): Promise<void> {
    const ouverte = await this.repo.findOne({
      where: {
        prospect: { id: prospectId },
        titre,
        statut: In([StatutPlanningEtape.A_FAIRE, StatutPlanningEtape.EN_COURS]),
      },
    });
    if (!ouverte) return;

    ouverte.statut = StatutPlanningEtape.FAIT;
    ouverte.completedAt = new Date();
    await this.repo.save(ouverte);
  }

  // Crée, met à jour ou annule l'étape de rappel de renouvellement liée à une
  // mission, selon qu'elle est en cours et proche de sa date de fin.
  async synchroniserRenouvellementMission(mission: Mission): Promise<void> {
    // Les missions rattachées à un prospect (préparation LM avant conversion)
    // n'entrent pas dans le cycle de renouvellement client.
    if (!mission.client) return;

    const dansLaFenetre =
      mission.statut === StatutMission.EN_COURS &&
      mission.dateFin !== null &&
      joursRestants(new Date(mission.dateFin)) <= RENOUVELLEMENT_FENETRE_JOURS;

    const existante = await this.repo.findOne({
      where: { mission: { id: mission.id } },
    });

    if (dansLaFenetre) {
      if (existante) {
        existante.dateEcheance = mission.dateFin;
        if (existante.statut === StatutPlanningEtape.ANNULEE) {
          existante.statut = StatutPlanningEtape.A_FAIRE;
        }
        await this.repo.save(existante);
      } else {
        const label = TYPE_MISSION_LABELS[mission.type] ?? mission.type;
        await this.repo.save(
          this.repo.create({
            titre: `Renouvellement mission — ${label}`,
            description:
              'Étape générée automatiquement : la mission arrive à échéance.',
            type: TypePlanningEtape.REGLEMENTAIRE,
            dateEcheance: mission.dateFin,
            client: { id: mission.client.id } as Client,
            mission,
            createdBy: mission.createdBy,
          }),
        );
      }
    } else if (existante && existante.statut !== StatutPlanningEtape.FAIT) {
      existante.statut = StatutPlanningEtape.ANNULEE;
      await this.repo.save(existante);
    }
  }

  // Job quotidien : obligations en retard, obligations manquantes par client
  // actif, rappels de renouvellement de mission.
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async synchroniserQuotidien(): Promise<void> {
    await this.obligationsService.marquerEnRetard();

    const clients = await this.clientRepo.find({
      where: { statut: StatutClient.ACTIF },
    });
    for (const client of clients) {
      await this.obligationsService.synchroniserPourClient(client.id);
    }

    const missions = await this.missionRepo.find({
      where: { dateFin: Not(IsNull()) },
      relations: ['client', 'createdBy'],
    });
    for (const mission of missions) {
      await this.synchroniserRenouvellementMission(mission);
    }
  }

  // Agrège étapes de planning, obligations ouvertes et fins de mission en une
  // seule liste pour le calendrier global.
  async findCalendrier(): Promise<EcheanceCalendrier[]> {
    const [etapes, obligations, missions] = await Promise.all([
      this.repo.find({
        where: {
          statut: In([
            StatutPlanningEtape.A_FAIRE,
            StatutPlanningEtape.EN_COURS,
          ]),
        },
        relations: ['client', 'prospect'],
      }),
      this.obligationRepo.find({
        where: {
          statut: In([StatutObligation.A_FAIRE, StatutObligation.EN_RETARD]),
        },
        relations: ['client', 'prospect'],
      }),
      this.missionRepo.find({
        where: { statut: StatutMission.EN_COURS, dateFin: Not(IsNull()) },
        relations: ['client'],
      }),
    ]);

    const clientRef = (client: Client) => ({
      id: client.id,
      ref: client.ref,
      raisonSociale: client.raisonSociale,
    });
    const prospectRef = (prospect: Prospect) => ({
      id: prospect.id,
      ref: prospect.ref,
      nom: prospect.nom,
    });

    const etapeItems: EcheanceCalendrier[] = etapes.map((e) => ({
      id: e.id,
      source: 'PLANNING',
      titre: e.titre,
      type: e.type,
      statut: e.statut,
      dateEcheance: e.dateEcheance ? String(e.dateEcheance) : null,
      client: e.client ? clientRef(e.client) : undefined,
      prospect: e.prospect ? prospectRef(e.prospect) : undefined,
    }));

    const obligationItems: EcheanceCalendrier[] = obligations.map((o) => ({
      id: o.id,
      source: 'OBLIGATION',
      titre: TYPE_OBLIGATION_LABELS[o.type] ?? o.type,
      type: o.type,
      statut: o.statut,
      dateEcheance: o.dateEcheance ? String(o.dateEcheance) : null,
      client: o.client ? clientRef(o.client) : undefined,
      prospect: o.prospect ? prospectRef(o.prospect) : undefined,
    }));

    const missionItems: EcheanceCalendrier[] = missions
      .filter((m) => m.client)
      .map((m) => ({
        id: m.id,
        source: 'MISSION',
        titre: `Fin de mission — ${TYPE_MISSION_LABELS[m.type] ?? m.type}`,
        type: m.type,
        statut: m.statut,
        dateEcheance: m.dateFin ? String(m.dateFin) : null,
        client: clientRef(m.client as Client),
      }));

    return [...etapeItems, ...obligationItems, ...missionItems];
  }
}

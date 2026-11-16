import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { Prospect } from '../prospects/entities/prospect.entity';
import { Client } from '../clients/entities/client.entity';
import { QuestionnaireAcceptation } from '../questionnaires/entities/questionnaire-acceptation.entity';
import { AcceptationMission } from '../acceptations/entities/acceptation-mission.entity';
import { BeneficiaireEffectif } from '../beneficiaires/entities/beneficiaire-effectif.entity';
import { Mission } from '../missions/entities/mission.entity';
import {
  DossierRisques,
  NiveauCartographie,
  RISQUES_CABINET,
  niveauCartographie,
} from './risques-cabinet';

export interface DossierCartographie {
  type: 'prospect' | 'client';
  id: string;
  ref: string;
  nom: string;
}

export interface CartographieRisques {
  risques: {
    numero: number;
    libelle: string;
    probabilite: number;
    impact: number;
    score: number;
    niveau: NiveauCartographie;
    vigilanceRenforcee: boolean;
    regle: string;
    deductible: boolean;
    dossiers: DossierCartographie[];
  }[];
  // Tous les dossiers actifs, avec les numéros des risques qui les
  // concernent (liste vide si aucun).
  dossiers: (DossierCartographie & { risques: number[] })[];
}

@Injectable()
export class CartographieService {
  constructor(
    @InjectRepository(Prospect)
    private readonly prospectRepo: Repository<Prospect>,
    @InjectRepository(Client)
    private readonly clientRepo: Repository<Client>,
    @InjectRepository(QuestionnaireAcceptation)
    private readonly labRepo: Repository<QuestionnaireAcceptation>,
    @InjectRepository(AcceptationMission)
    private readonly acceptationRepo: Repository<AcceptationMission>,
    @InjectRepository(BeneficiaireEffectif)
    private readonly uboRepo: Repository<BeneficiaireEffectif>,
    @InjectRepository(Mission)
    private readonly missionRepo: Repository<Mission>,
  ) {}

  async calculer(): Promise<CartographieRisques> {
    const [prospects, clients, labs, acceptations, ubosPpe, missions] =
      await Promise.all([
        this.prospectRepo.find({ where: { client: IsNull() } }),
        this.clientRepo.find({ relations: ['prospect'] }),
        this.labRepo.find({ relations: ['prospect', 'client'] }),
        this.acceptationRepo.find({
          relations: ['prospect', 'client'],
          order: { createdAt: 'DESC' },
        }),
        this.uboRepo.find({
          where: { ppe: true },
          relations: ['prospect', 'client'],
        }),
        this.missionRepo.find({ relations: ['prospect', 'client'] }),
      ]);

    const labDe = (prospectId?: string | null, clientId?: string) =>
      labs.find(
        (q) =>
          (clientId && q.client?.id === clientId) ||
          (prospectId && q.prospect?.id === prospectId),
      );
    const acceptationDe = (cle: 'prospect' | 'client', id: string) =>
      acceptations.find((a) => a[cle]?.id === id);
    const uboPpe = (cle: 'prospect' | 'client', id: string) =>
      ubosPpe.some((u) => u[cle]?.id === id);
    const typesMission = (cle: 'prospect' | 'client', id: string) =>
      missions.filter((m) => m[cle]?.id === id).map((m) => m.type as string);

    const entrees: { dossier: DossierCartographie; donnees: DossierRisques }[] =
      [
        ...prospects.map((p) => ({
          dossier: {
            type: 'prospect' as const,
            id: p.id,
            ref: p.ref,
            nom: p.nom,
          },
          donnees: {
            reponsesLab: labDe(p.id)?.reponses ?? {},
            reponsesAcceptation:
              acceptationDe('prospect', p.id)?.reponses ?? {},
            ppe: uboPpe('prospect', p.id),
            formeJuridique: p.formeJuridique,
            codeNaf: p.codeNaf,
            dateCreationEntreprise: null,
            typesMission: typesMission('prospect', p.id),
          },
        })),
        ...clients.map((c) => ({
          dossier: {
            type: 'client' as const,
            id: c.id,
            ref: c.ref,
            nom: c.raisonSociale,
          },
          donnees: {
            reponsesLab: labDe(c.prospect?.id, c.id)?.reponses ?? {},
            reponsesAcceptation: acceptationDe('client', c.id)?.reponses ?? {},
            ppe: c.ppe || uboPpe('client', c.id),
            formeJuridique: c.formeJuridique,
            codeNaf: c.codeNaf,
            dateCreationEntreprise: c.dateCreationEntreprise,
            typesMission: typesMission('client', c.id),
          },
        })),
      ];

    const risques = RISQUES_CABINET.map((r) => {
      const score = r.probabilite * r.impact;
      return {
        numero: r.numero,
        libelle: r.libelle,
        probabilite: r.probabilite,
        impact: r.impact,
        score,
        niveau: niveauCartographie(score),
        vigilanceRenforcee: !!r.vigilanceRenforcee,
        regle: r.regle,
        deductible: r.concerne !== null,
        dossiers: r.concerne
          ? entrees.filter((e) => r.concerne!(e.donnees)).map((e) => e.dossier)
          : [],
      };
    });

    const dossiers = entrees.map(({ dossier, donnees }) => ({
      ...dossier,
      risques: RISQUES_CABINET.filter((r) => r.concerne?.(donnees)).map(
        (r) => r.numero,
      ),
    }));

    return { risques, dossiers };
  }
}

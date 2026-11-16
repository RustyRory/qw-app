import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Not, Repository } from 'typeorm';
import puppeteer from 'puppeteer';
import { Client } from '../clients/entities/client.entity';
import { Prospect } from '../prospects/entities/prospect.entity';
import { ScoreRisque } from '../scoring/entities/score-risque.entity';
import { BeneficiaireEffectif } from '../beneficiaires/entities/beneficiaire-effectif.entity';
import { Mission } from '../missions/entities/mission.entity';
import { LettreMission } from '../lettres-mission/entities/lettre-mission.entity';
import { Obligation } from '../obligations/entities/obligation.entity';
import { Document } from '../documents/entities/document.entity';
import {
  AcceptationMission,
  StatutAcceptation,
} from '../acceptations/entities/acceptation-mission.entity';
import { ScreeningCorrespondance } from '../screening/entities/screening-correspondance.entity';
import { CabinetService } from '../cabinet/cabinet.service';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '../audit/entities/audit-log.entity';
import { CartographieService } from './cartographie.service';
import { documentsManquants } from '../common/document-checklist';
import {
  NiveauRisque,
  StatutClient,
  StatutKanban,
  StatutObligation,
} from '../common/enums';
import type { AutoScoreReponses } from '../scoring/auto-score.util';
import {
  DonneesRapport,
  DossierRapport,
  construireRapportHtml,
  piedDePageRapport,
} from './rapport-template';

type Cle = 'client' | 'prospect';

// Rapport PDF de la cartographie des risques : synthèse du cabinet puis une
// fiche détaillée par dossier (clients non résiliés et prospects en cours).
@Injectable()
export class RapportCartographieService {
  constructor(
    @InjectRepository(Client)
    private readonly clientRepo: Repository<Client>,
    @InjectRepository(Prospect)
    private readonly prospectRepo: Repository<Prospect>,
    @InjectRepository(ScoreRisque)
    private readonly scoreRepo: Repository<ScoreRisque>,
    @InjectRepository(BeneficiaireEffectif)
    private readonly uboRepo: Repository<BeneficiaireEffectif>,
    @InjectRepository(Mission)
    private readonly missionRepo: Repository<Mission>,
    @InjectRepository(LettreMission)
    private readonly lettreRepo: Repository<LettreMission>,
    @InjectRepository(Obligation)
    private readonly obligationRepo: Repository<Obligation>,
    @InjectRepository(Document)
    private readonly documentRepo: Repository<Document>,
    @InjectRepository(AcceptationMission)
    private readonly acceptationRepo: Repository<AcceptationMission>,
    @InjectRepository(ScreeningCorrespondance)
    private readonly correspondanceRepo: Repository<ScreeningCorrespondance>,
    private readonly cartographieService: CartographieService,
    private readonly cabinetService: CabinetService,
    private readonly auditService: AuditService,
  ) {}

  async donnees(): Promise<DonneesRapport> {
    const [
      clients,
      prospects,
      scores,
      ubos,
      missions,
      lettres,
      obligations,
      documents,
      acceptations,
      correspondances,
      cartographie,
      cabinet,
    ] = await Promise.all([
      this.clientRepo.find({
        where: { statut: Not(StatutClient.RESILIE) },
        relations: ['kycValidatedBy'],
      }),
      this.prospectRepo.find({
        where: {
          client: IsNull(),
          statutKanban: Not(In([StatutKanban.REFUSE, StatutKanban.CONVERTI])),
        },
        relations: ['assignedTo'],
      }),
      this.scoreRepo.find({
        relations: ['client', 'prospect'],
        order: { createdAt: 'DESC' },
      }),
      this.uboRepo.find({ relations: ['client', 'prospect'] }),
      this.missionRepo.find({
        relations: ['client', 'prospect'],
        order: { dateDebut: 'ASC' },
      }),
      this.lettreRepo.find({
        relations: ['mission'],
        order: { version: 'DESC' },
      }),
      this.obligationRepo.find({
        where: { statut: Not(StatutObligation.FAIT) },
        relations: ['client', 'prospect'],
        order: { dateEcheance: 'ASC' },
      }),
      this.documentRepo.find({
        relations: ['client', 'prospect'],
        select: {
          id: true,
          type: true,
          dateExpiration: true,
          client: { id: true },
          prospect: { id: true },
        },
      }),
      this.acceptationRepo.find({
        relations: ['client', 'prospect', 'decideePar'],
        order: { createdAt: 'DESC' },
      }),
      this.correspondanceRepo.find({
        relations: ['client', 'prospect', 'decidePar'],
        order: { createdAt: 'DESC' },
      }),
      this.cartographieService.calculer(),
      this.cabinetService.get(),
    ]);

    const de = <
      T extends {
        client?: { id: string } | null;
        prospect?: { id: string } | null;
      },
    >(
      liste: T[],
      cle: Cle,
      id: string,
    ) => liste.filter((x) => x[cle]?.id === id);

    const dossier = (
      cle: Cle,
      id: string,
      commun: Omit<
        DossierRapport,
        | 'scoring'
        | 'ppe'
        | 'risques'
        | 'ubos'
        | 'piecesManquantes'
        | 'gel'
        | 'acceptation'
        | 'missions'
        | 'obligations'
      >,
      ppe: boolean,
    ): DossierRapport => {
      const score = scores.find((s) => s[cle]?.id === id) ?? null;
      const rep = (score?.reponses ?? null) as AutoScoreReponses | null;
      const sesUbos = de(ubos, cle, id);
      const ppeEtendue = ppe || sesUbos.some((u) => u.ppe);
      const sesMissions = de(missions, cle, id);
      const acceptation = acceptations.find((a) => a[cle]?.id === id) ?? null;
      const risquesCarto =
        cartographie.dossiers.find((d) => d.type === cle && d.id === id)
          ?.risques ?? [];
      return {
        ...commun,
        ppe: ppeEtendue,
        scoring: score
          ? {
              score: score.score,
              niveau: score.niveau,
              niveauCalcule: rep?.niveauCalcule ?? null,
              calculeLe: score.createdAt,
              criteres: (rep?.criteres ?? []).map((c) => ({
                label: c.label,
                poids: c.poids,
                declenche: c.declenche,
              })),
              eleveDOffice: rep?.eleveDOffice ?? [],
              ajustement: rep?.ajustementManuel ?? null,
            }
          : null,
        risques: cartographie.risques
          .filter((r) => risquesCarto.includes(r.numero))
          .map((r) => ({
            numero: r.numero,
            libelle: r.libelle,
            score: r.score,
            niveau: r.niveau,
            vigilanceRenforcee: r.vigilanceRenforcee,
          })),
        ubos: sesUbos
          .sort((a, b) => b.pourcentageDetention - a.pourcentageDetention)
          .map((u) => ({
            nom: [u.prenom, u.nom].filter(Boolean).join(' '),
            pourcentage: Number(u.pourcentageDetention),
            nationalite: u.nationalite,
            ppe: u.ppe,
          })),
        piecesManquantes: documentsManquants(
          {
            typeEntite: commun.typeEntite,
            ppe: ppeEtendue,
            risqueEleve: score?.niveau === NiveauRisque.ELEVE,
          },
          de(documents, cle, id),
        ),
        gel: {
          correspondances: de(correspondances, cle, id).map((c) => ({
            personne: c.personneControlee,
            nomRegistre: c.nomRegistre,
            statut: c.statut,
            commentaire: c.commentaire,
            decidePar: c.decidePar
              ? `${c.decidePar.prenom} ${c.decidePar.nom}`
              : null,
            decideLe: c.decideAt,
          })),
        },
        acceptation: acceptation
          ? {
              acceptee: acceptation.statut === StatutAcceptation.ACCEPTEE,
              decideeLe: acceptation.decideeAt,
              decideePar: acceptation.decideePar
                ? `${acceptation.decideePar.prenom} ${acceptation.decideePar.nom}`
                : null,
            }
          : null,
        missions: sesMissions.map((m) => {
          const lettre = lettres.find((l) => l.mission.id === m.id) ?? null;
          return {
            type: m.type,
            statut: m.statut,
            dateDebut: m.dateDebut,
            honoraires: m.honoraires === null ? null : Number(m.honoraires),
            lettre: lettre
              ? {
                  version: lettre.version,
                  validee: lettre.valideeParResponsable,
                  signeeCabinetLe: lettre.signeeAt,
                  signeeClientLe: lettre.signeeParClientAt,
                }
              : null,
          };
        }),
        obligations: de(obligations, cle, id).map((o) => ({
          type: o.type,
          statut: o.statut,
          echeance: o.dateEcheance,
        })),
      };
    };

    const dossiers: DossierRapport[] = [
      ...clients.map((c) =>
        dossier(
          'client',
          c.id,
          {
            type: 'client',
            id: c.id,
            ref: c.ref,
            nom: c.raisonSociale,
            etape: c.statut,
            typeEntite: c.typeEntite,
            siren: c.siren ?? c.siret?.slice(0, 9) ?? null,
            formeJuridique: c.formeJuridique,
            codeNaf: c.codeNaf,
            activite: c.activitePrincipale,
            representantLegal: c.representantLegal,
            adresse: [
              c.adresseSiege,
              [c.codePostal, c.ville].filter(Boolean).join(' '),
            ]
              .filter(Boolean)
              .join(', '),
            pays: c.pays,
            dateCreation: c.dateCreationEntreprise,
            chiffreAffaires:
              c.chiffreAffaires === null ? null : Number(c.chiffreAffaires),
            effectif: c.effectif,
            ppeDetail: c.ppeDetail,
            kyc: {
              statut: c.kycStatut,
              valideLe: c.kycCompletedAt,
              validePar: c.kycValidatedBy
                ? `${c.kycValidatedBy.prenom} ${c.kycValidatedBy.nom}`
                : null,
            },
            screening: {
              statut: c.screeningStatut,
              date: c.screeningDate,
              registreDu: c.screeningRegistreDu,
            },
            suiviPar: null,
          },
          c.ppe,
        ),
      ),
      ...prospects.map((p) =>
        dossier(
          'prospect',
          p.id,
          {
            type: 'prospect',
            id: p.id,
            ref: p.ref,
            nom: p.nom,
            etape: p.statutKanban,
            typeEntite: p.typeEntite,
            siren: p.siret?.slice(0, 9) ?? null,
            formeJuridique: p.formeJuridique,
            codeNaf: p.codeNaf,
            activite: p.activite,
            representantLegal: p.representantLegal,
            adresse: [
              p.adresse,
              [p.codePostal, p.ville].filter(Boolean).join(' '),
            ]
              .filter(Boolean)
              .join(', '),
            pays: p.pays,
            dateCreation: null,
            chiffreAffaires:
              p.chiffreAffaires === null ? null : Number(p.chiffreAffaires),
            effectif: p.effectif,
            ppeDetail: null,
            kyc: null,
            screening: {
              statut: p.screeningStatut,
              date: p.screeningDate,
              registreDu: p.screeningRegistreDu,
            },
            suiviPar: p.assignedTo
              ? `${p.assignedTo.prenom} ${p.assignedTo.nom}`
              : null,
          },
          false,
        ),
      ),
    ];

    const ordre = { ELEVE: 0, MOYEN: 1, FAIBLE: 2 } as const;
    dossiers.sort(
      (a, b) =>
        (a.scoring ? ordre[a.scoring.niveau] : 3) -
          (b.scoring ? ordre[b.scoring.niveau] : 3) ||
        (b.scoring?.score ?? -1) - (a.scoring?.score ?? -1) ||
        a.nom.localeCompare(b.nom, 'fr'),
    );

    const ids = new Set(dossiers.map((d) => `${d.type}:${d.id}`));
    return {
      genereLe: new Date(),
      cabinet,
      dossiers,
      risques: cartographie.risques.map((r) => ({
        numero: r.numero,
        libelle: r.libelle,
        probabilite: r.probabilite,
        impact: r.impact,
        score: r.score,
        niveau: r.niveau,
        vigilanceRenforcee: r.vigilanceRenforcee,
        deductible: r.deductible,
        dossiers: r.dossiers
          .filter((d) => ids.has(`${d.type}:${d.id}`))
          .map((d) => d.nom),
      })),
    };
  }

  async genererPdf(userId: string): Promise<Buffer> {
    const donnees = await this.donnees();
    const html = construireRapportHtml(donnees);
    const browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'load' });
      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        displayHeaderFooter: true,
        headerTemplate: '<span></span>',
        footerTemplate: piedDePageRapport(donnees),
        margin: { top: '14mm', bottom: '18mm', left: '14mm', right: '14mm' },
      });
      await this.auditService.log(
        userId,
        AuditAction.READ,
        'cartographie',
        userId,
        {
          export: 'rapport-cartographie-pdf',
          dossiers: donnees.dossiers.length,
        },
      );
      return Buffer.from(pdf);
    } finally {
      await browser.close();
    }
  }
}

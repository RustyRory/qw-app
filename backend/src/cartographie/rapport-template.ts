// Gabarit HTML du rapport PDF de la cartographie des risques (rendu par
// Chromium via puppeteer). Pas de glyphes spéciaux (coches, émojis) : la
// police du conteneur Alpine ne les a pas, les repères sont dessinés en CSS.
import {
  StatutKanban,
  StatutKyc,
  StatutMission,
  StatutObligation,
  ScreeningStatut,
  StatutClient,
  TypeDocument,
  TypeEntite,
  TypeMission,
  TypeObligation,
  NiveauRisque,
} from '../common/enums';
import { TYPES_MISSION } from '../common/types-mission';
import type { NiveauCartographie } from './risques-cabinet';
import type { ParametresCabinet } from '../cabinet/cabinet.entity';
import { StatutCorrespondance } from '../screening/entities/screening-correspondance.entity';

export interface DossierRapport {
  type: 'client' | 'prospect';
  id: string;
  ref: string;
  nom: string;
  etape: StatutClient | StatutKanban;
  typeEntite: TypeEntite;
  siren: string | null;
  formeJuridique: string | null;
  codeNaf: string | null;
  activite: string | null;
  representantLegal: string | null;
  adresse: string;
  pays: string;
  dateCreation: Date | null;
  chiffreAffaires: number | null;
  effectif: number | null;
  ppe: boolean;
  ppeDetail: string | null;
  suiviPar: string | null;
  kyc: {
    statut: StatutKyc;
    valideLe: Date | null;
    validePar: string | null;
  } | null;
  screening: {
    statut: ScreeningStatut;
    date: Date | null;
    registreDu: Date | null;
  };
  scoring: {
    score: number;
    niveau: NiveauRisque;
    niveauCalcule: NiveauRisque | null;
    calculeLe: Date;
    criteres: { label: string; poids: number; declenche: boolean }[];
    eleveDOffice: string[];
    ajustement: {
      niveau: NiveauRisque;
      justification: string;
      par?: string | null;
      le?: string | null;
    } | null;
  } | null;
  risques: {
    numero: number;
    libelle: string;
    score: number;
    niveau: NiveauCartographie;
    vigilanceRenforcee: boolean;
  }[];
  ubos: {
    nom: string;
    pourcentage: number;
    nationalite: string | null;
    ppe: boolean;
  }[];
  piecesManquantes: TypeDocument[];
  gel: {
    correspondances: {
      personne: string;
      nomRegistre: string;
      statut: StatutCorrespondance;
      commentaire: string | null;
      decidePar: string | null;
      decideLe: Date | null;
    }[];
  };
  acceptation: {
    acceptee: boolean;
    decideeLe: Date | null;
    decideePar: string | null;
  } | null;
  missions: {
    type: TypeMission;
    statut: StatutMission;
    dateDebut: Date;
    honoraires: number | null;
    lettre: {
      version: number;
      validee: boolean;
      signeeCabinetLe: Date | null;
      signeeClientLe: Date | null;
    } | null;
  }[];
  obligations: {
    type: TypeObligation;
    statut: StatutObligation;
    echeance: Date | null;
  }[];
}

export interface DonneesRapport {
  genereLe: Date;
  cabinet: ParametresCabinet;
  dossiers: DossierRapport[];
  risques: {
    numero: number;
    libelle: string;
    probabilite: number;
    impact: number;
    score: number;
    niveau: NiveauCartographie;
    vigilanceRenforcee: boolean;
    deductible: boolean;
    dossiers: string[];
  }[];
}

// ── Libellés ────────────────────────────────────────────────────────────

const ETAPE: Record<string, string> = {
  [StatutClient.ACTIF]: 'Client actif',
  [StatutClient.INACTIF]: 'Client inactif',
  [StatutClient.RESILIE]: 'Client résilié',
  [StatutKanban.PRISE_CONTACT]: 'Prospect — prise de contact',
  [StatutKanban.PREPARATION_LAB]: 'Prospect — préparation LAB',
  [StatutKanban.VALIDATION_LAB]: 'Prospect — validation LAB',
  [StatutKanban.LM_A_FAIRE]: 'Prospect — lettre de mission à faire',
  [StatutKanban.LM_ENVOYEE]: 'Prospect — lettre de mission envoyée',
  [StatutKanban.REFUSE]: 'Prospect refusé',
  [StatutKanban.CONVERTI]: 'Prospect converti',
};

const NIVEAU: Record<NiveauRisque, string> = {
  FAIBLE: 'Faible',
  MOYEN: 'Moyen',
  ELEVE: 'Élevé',
};

const NIVEAU_CARTO: Record<NiveauCartographie, string> = {
  FAIBLE: 'Faible',
  MODERE: 'Modéré',
  ELEVE: 'Élevé',
};

const KYC: Record<StatutKyc, string> = {
  INCOMPLET: 'Incomplet',
  COMPLET: 'Complet, à valider',
  VALIDE: 'Validé',
  EXPIRE: 'Expiré',
};

const GEL: Record<ScreeningStatut, string> = {
  NON_EFFECTUE: 'Contrôle en attente',
  OK: 'Aucune correspondance',
  ALERTE: 'Alerte',
};

const CORRESPONDANCE: Record<StatutCorrespondance, string> = {
  A_VERIFIER: 'À vérifier',
  HOMONYME: 'Homonyme (écartée)',
  CONFIRMEE: 'Confirmée',
};

const MISSION_STATUT: Record<StatutMission, string> = {
  EN_COURS: 'En cours',
  SUSPENDUE: 'Suspendue',
  TERMINEE: 'Terminée',
  RESILIEE: 'Résiliée',
};

const OBLIGATION: Record<TypeObligation, string> = {
  KYC_VERIFICATION: 'Vérification KYC (revue annuelle)',
  EVALUATION_RISQUE: 'Questionnaires de maintien de mission',
  MISE_A_JOUR_DOCS: 'Mise à jour des documents',
  VALIDATION_RELATION: 'Questionnaire à valider',
  LETTRE_MISSION: 'Lettre de mission à faire',
  VALIDATION_LETTRE_MISSION: 'Lettre de mission à valider',
  SIGNATURE_LETTRE_MISSION: 'Lettre de mission à signer',
  INFORMATIONS_A_COMPLETER: 'Informations légales à compléter',
  QUESTIONNAIRES_A_COMPLETER: 'Questionnaires LAB et d’acceptation à remplir',
};

const OBLIGATION_STATUT: Record<StatutObligation, string> = {
  A_FAIRE: 'À faire',
  FAIT: 'Fait',
  EN_RETARD: 'En retard',
  EXPIRE: 'Expirée',
};

const PIECE: Record<string, string> = {
  PIECE_IDENTITE: 'Pièce d’identité',
  PIECE_IDENTITE_DIRIGEANT: 'Pièce d’identité du dirigeant',
  PIECE_IDENTITE_BENEFICIAIRE: 'Pièce d’identité des bénéficiaires',
  JUSTIFICATIF_DOMICILE: 'Justificatif de domicile',
  KBIS: 'Kbis',
  EXTRAIT_INPI: 'Extrait INPI',
  AVIS_SIRENE: 'Avis de situation Sirene',
  LISTE_ACTIONNAIRES: 'Liste des actionnaires',
  STATUTS: 'Statuts',
  LISTE_UBO: 'Liste des bénéficiaires effectifs',
  ATTESTATION_PPE: 'Attestation PPE',
  JUSTIFICATIF_FONDS: 'Justificatif d’origine des fonds',
};

// Catégories juridiques INSEE les plus courantes (Sirene renvoie le code).
const FORMES: Record<string, string> = {
  '1000': 'Entrepreneur individuel',
  '5202': 'Société en nom collectif',
  '5306': 'Société en commandite simple',
  '5498': 'EURL',
  '5499': 'SARL',
  '5410': 'SARL nationale',
  '5422': 'SARL immobilière pour le commerce et l’industrie',
  '5485': 'Société d’exercice libéral à responsabilité limitée',
  '5505': 'SA à participation ouvrière à conseil d’administration',
  '5599': 'SA à conseil d’administration',
  '5699': 'SA à directoire',
  '5710': 'SAS',
  '5720': 'SASU',
  '5785': 'Société d’exercice libéral par actions simplifiée',
  '6540': 'Société civile immobilière',
  '6599': 'Société civile',
  '6585': 'Société civile de moyens',
  '9220': 'Association déclarée',
  '9221': 'Association déclarée d’insertion par l’économique',
  '9300': 'Fondation',
};

function forme(f: string | null): string {
  if (!f) return '—';
  const lib = FORMES[f.trim()];
  return lib ? `${e(lib)} <span class="gris-txt">(${e(f)})</span>` : e(f);
}

const PROBABILITES = ['Rare', 'Possible', 'Probable', 'Très probable'];
const IMPACTS = ['Mineur', 'Modéré', 'Grave', 'Critique'];

// ── Utilitaires ─────────────────────────────────────────────────────────

function e(v: string | number | null | undefined): string {
  return (
    v === null || v === undefined ? '' : typeof v === 'string' ? v : String(v)
  )
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function date(d: Date | string | null | undefined): string {
  if (!d) return '—';
  const x = new Date(d);
  if (Number.isNaN(x.getTime())) return '—';
  return x.toLocaleDateString('fr-FR', { timeZone: 'Europe/Paris' });
}

function montant(n: number | null): string {
  if (n === null || n === undefined) return '—';
  return `${n.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €`;
}

const ou = (v: string | number | null | undefined) =>
  v === null || v === undefined || v === '' ? '—' : e(v);

function badgeNiveau(n: NiveauRisque | null, gros = false): string {
  if (!n)
    return `<span class="badge gris${gros ? ' gros' : ''}">Sans score</span>`;
  const cls =
    n === NiveauRisque.ELEVE
      ? 'rouge'
      : n === NiveauRisque.MOYEN
        ? 'ambre'
        : 'vert';
  return `<span class="badge ${cls}${gros ? ' gros' : ''}">${NIVEAU[n]}</span>`;
}

function badgeCarto(n: NiveauCartographie): string {
  const cls = n === 'ELEVE' ? 'rouge' : n === 'MODERE' ? 'ambre' : 'vert';
  return `<span class="badge ${cls}">${NIVEAU_CARTO[n]}</span>`;
}

function badgeGel(s: ScreeningStatut): string {
  const cls =
    s === ScreeningStatut.ALERTE
      ? 'rouge'
      : s === ScreeningStatut.OK
        ? 'vert'
        : 'gris';
  return `<span class="badge ${cls}">${GEL[s]}</span>`;
}

function badgeKyc(k: DossierRapport['kyc']): string {
  if (!k) return '<span class="badge gris">Prospect</span>';
  const cls =
    k.statut === StatutKyc.VALIDE
      ? 'vert'
      : k.statut === StatutKyc.EXPIRE
        ? 'rouge'
        : 'ambre';
  return `<span class="badge ${cls}">${KYC[k.statut]}</span>`;
}

const enRetard = (o: DossierRapport['obligations'][number], now: Date) =>
  o.statut === StatutObligation.EN_RETARD ||
  o.statut === StatutObligation.EXPIRE ||
  (!!o.echeance && new Date(o.echeance) < now);

const lettreNonSignee = (d: DossierRapport) =>
  d.missions.some(
    (m) =>
      m.statut === StatutMission.EN_COURS &&
      (!m.lettre || !m.lettre.signeeCabinetLe),
  );

const gelOuvert = (d: DossierRapport) =>
  d.screening.statut === ScreeningStatut.ALERTE ||
  d.gel.correspondances.some((c) => c.statut !== StatutCorrespondance.HOMONYME);

const ancre = (d: DossierRapport) => `d-${d.type}-${d.id}`;

// ── Sections ────────────────────────────────────────────────────────────

function entete(r: DonneesRapport): string {
  const c = r.cabinet;
  return `
  <header class="couverture">
    <div class="couv-haut">
      ${c.logoDataUri ? `<img class="logo" src="${e(c.logoDataUri)}" alt="">` : ''}
      <div>
        <div class="cabinet">${e(c.nom)}</div>
        <div class="petit">${e(c.raisonSociale)} · ${e(c.adresse)}, ${e(c.codePostal)} ${e(c.ville)}</div>
      </div>
    </div>
    <div class="surtitre">Lutte contre le blanchiment et le financement du terrorisme</div>
    <h1>Cartographie des risques du portefeuille</h1>
    <div class="meta">
      Rapport généré le ${date(r.genereLe)} à ${r.genereLe.toLocaleTimeString('fr-FR', { timeZone: 'Europe/Paris', hour: '2-digit', minute: '2-digit' })}
      · Périmètre : clients non résiliés et prospects en cours
      · Document confidentiel, usage interne
    </div>
  </header>`;
}

function synthese(r: DonneesRapport): string {
  const d = r.dossiers;
  const now = r.genereLe;
  const clients = d.filter((x) => x.type === 'client');
  const n = (f: (x: DossierRapport) => boolean) => d.filter(f).length;
  const niveaux = {
    ELEVE: n((x) => x.scoring?.niveau === NiveauRisque.ELEVE),
    MOYEN: n((x) => x.scoring?.niveau === NiveauRisque.MOYEN),
    FAIBLE: n((x) => x.scoring?.niveau === NiveauRisque.FAIBLE),
    SANS: n((x) => !x.scoring),
  };
  const total = d.length || 1;
  const barre = (k: keyof typeof niveaux, cls: string) =>
    niveaux[k] > 0
      ? `<div class="seg ${cls}" style="width:${(niveaux[k] / total) * 100}%"></div>`
      : '';

  const kpi = (val: number | string, lib: string, alerte = false) =>
    `<div class="kpi${alerte ? ' alerte' : ''}"><div class="kpi-val">${val}</div><div class="kpi-lib">${lib}</div></div>`;

  const vigilance = n(
    (x) =>
      x.ppe ||
      x.risques.some((r2) => r2.vigilanceRenforcee) ||
      (x.scoring?.eleveDOffice.length ?? 0) > 0,
  );
  const gel = n(gelOuvert);
  const kycNonValide = clients.filter(
    (x) => x.kyc?.statut !== StatutKyc.VALIDE,
  ).length;
  const pieces = n((x) => x.piecesManquantes.length > 0);
  const retards = n((x) => x.obligations.some((o) => enRetard(o, now)));
  const lettres = n(lettreNonSignee);

  // Points d'attention : une ligne par dossier concerné.
  const points: string[] = [];
  for (const x of d) {
    const lien = `<a href="#${ancre(x)}">${e(x.nom)}</a>`;
    if (gelOuvert(x)) {
      const confirmee = x.gel.correspondances.some(
        (c) => c.statut === StatutCorrespondance.CONFIRMEE,
      );
      points.push(
        `${lien} : registre des gels — ${confirmee ? 'correspondance confirmée' : x.gel.correspondances.length ? 'correspondance à vérifier' : 'dossier en alerte'}`,
      );
    }
    if (x.scoring?.eleveDOffice.length)
      points.push(
        `${lien} : risque élevé d’office (${e(x.scoring.eleveDOffice.join(', '))})`,
      );
    if (x.ppe) points.push(`${lien} : personne politiquement exposée`);
    if (x.type === 'client' && x.kyc?.statut !== StatutKyc.VALIDE)
      points.push(`${lien} : KYC ${KYC[x.kyc!.statut].toLowerCase()}`);
    if (x.piecesManquantes.length)
      points.push(
        `${lien} : ${x.piecesManquantes.length} pièce(s) manquante(s) ou expirée(s)`,
      );
    const ret = x.obligations.filter((o) => enRetard(o, now)).length;
    if (ret) points.push(`${lien} : ${ret} obligation(s) en retard`);
    if (!x.scoring) points.push(`${lien} : aucun scoring calculé`);
  }

  return `
  <section>
    <h2>1. Synthèse</h2>
    <div class="kpis">
      ${kpi(d.length, 'dossiers analysés')}
      ${kpi(clients.length, 'clients')}
      ${kpi(d.length - clients.length, 'prospects en cours')}
      ${kpi(vigilance, 'en vigilance renforcée', vigilance > 0)}
      ${kpi(gel, 'alerte(s) registre des gels', gel > 0)}
      ${kpi(kycNonValide, 'KYC client non validé(s)', kycNonValide > 0)}
      ${kpi(pieces, 'dossier(s) avec pièces manquantes', pieces > 0)}
      ${kpi(retards, 'dossier(s) avec obligations en retard', retards > 0)}
      ${kpi(lettres, 'mission(s) sans lettre signée', lettres > 0)}
    </div>

    <h3>Répartition par niveau de risque (scoring LAB)</h3>
    <div class="repartition">${barre('ELEVE', 'rouge')}${barre('MOYEN', 'ambre')}${barre('FAIBLE', 'vert')}${barre('SANS', 'gris')}</div>
    <table class="compact">
      <tr><th>Niveau</th><th>Seuil</th><th class="num">Dossiers</th><th class="num">Part</th></tr>
      <tr><td>${badgeNiveau(NiveauRisque.ELEVE)}</td><td>67 points et plus, ou élevé d’office</td><td class="num">${niveaux.ELEVE}</td><td class="num">${Math.round((niveaux.ELEVE / total) * 100)} %</td></tr>
      <tr><td>${badgeNiveau(NiveauRisque.MOYEN)}</td><td>34 à 66 points</td><td class="num">${niveaux.MOYEN}</td><td class="num">${Math.round((niveaux.MOYEN / total) * 100)} %</td></tr>
      <tr><td>${badgeNiveau(NiveauRisque.FAIBLE)}</td><td>0 à 33 points</td><td class="num">${niveaux.FAIBLE}</td><td class="num">${Math.round((niveaux.FAIBLE / total) * 100)} %</td></tr>
      <tr><td>${badgeNiveau(null)}</td><td>Scoring non encore calculé</td><td class="num">${niveaux.SANS}</td><td class="num">${Math.round((niveaux.SANS / total) * 100)} %</td></tr>
    </table>

    <h3>Points d’attention</h3>
    ${
      points.length
        ? `<ul class="points">${points.map((p) => `<li>${p}</li>`).join('')}</ul>`
        : '<p class="vide">Aucun point d’attention à la date du rapport.</p>'
    }
  </section>`;
}

function matrice(r: DonneesRapport): string {
  const niveauCase = (s: number) =>
    s >= 9 ? 'rouge' : s >= 5 ? 'ambre' : 'vert';
  const lignes = [4, 3, 2, 1]
    .map(
      (p) => `
      <tr>
        <th class="axe">${PROBABILITES[p - 1]}</th>
        ${[1, 2, 3, 4]
          .map((i) => {
            const ici = r.risques.filter(
              (x) => x.probabilite === p && x.impact === i,
            );
            return `<td class="case ${niveauCase(p * i)}">
              ${ici
                .map(
                  (x) =>
                    `<div class="risque-case">${e(x.libelle)}${x.dossiers.length ? ` <b>(${x.dossiers.length})</b>` : ''}</div>`,
                )
                .join('')}
            </td>`;
          })
          .join('')}
      </tr>`,
    )
    .join('');

  return `
  <section class="saut">
    <h2>2. Cartographie des 13 risques du cabinet</h2>
    <p class="intro">Chaque risque est coté en probabilité × impact (1 à 4). Entre parenthèses : nombre de dossiers du périmètre concernés.</p>
    <table class="matrice">
      ${lignes}
      <tr><th class="axe"></th>${IMPACTS.map((i) => `<th class="axe-bas">${i}</th>`).join('')}</tr>
    </table>
    <p class="legende">Lignes : probabilité · Colonnes : impact · Vert : 1 à 4 · Orange : 5 à 8 · Rouge : 9 à 16</p>

    <table>
      <thead><tr><th>N°</th><th>Risque</th><th class="num">P</th><th class="num">I</th><th class="num">P × I</th><th>Niveau</th><th>Dossiers concernés</th></tr></thead>
      <tbody>
      ${r.risques
        .map(
          (x) => `<tr>
            <td class="num">${x.numero}</td>
            <td>${e(x.libelle)}${x.vigilanceRenforcee ? ' <span class="badge rouge">vigilance renforcée</span>' : ''}</td>
            <td class="num">${x.probabilite}</td>
            <td class="num">${x.impact}</td>
            <td class="num"><b>${x.score}</b></td>
            <td>${badgeCarto(x.niveau)}</td>
            <td>${
              !x.deductible
                ? '<span class="gris-txt">Évalué au cas par cas / propre au cabinet</span>'
                : x.dossiers.length
                  ? e(x.dossiers.join(', '))
                  : '<span class="gris-txt">Aucun</span>'
            }</td>
          </tr>`,
        )
        .join('')}
      </tbody>
    </table>
  </section>`;
}

function sommaire(r: DonneesRapport): string {
  const now = r.genereLe;
  return `
  <section class="saut">
    <h2>3. Liste des dossiers</h2>
    <p class="intro">Classés du risque le plus élevé au plus faible. Cliquez sur un nom pour aller à sa fiche.</p>
    <table class="sommaire">
      <thead><tr>
        <th>Dossier</th><th>Statut</th><th>Niveau</th><th class="num">Score /100</th>
        <th>Registre des gels</th><th>KYC</th><th class="num">Pièces manq.</th><th class="num">Oblig. en retard</th>
      </tr></thead>
      <tbody>
      ${r.dossiers
        .map(
          (d) => `<tr>
            <td><a href="#${ancre(d)}"><b>${e(d.nom)}</b></a><div class="ref">${e(d.ref)}</div></td>
            <td>${e(ETAPE[d.etape] ?? d.etape)}</td>
            <td>${badgeNiveau(d.scoring?.niveau ?? null)}</td>
            <td class="num">${d.scoring ? d.scoring.score : '—'}</td>
            <td>${badgeGel(d.screening.statut)}</td>
            <td>${badgeKyc(d.kyc)}</td>
            <td class="num">${d.piecesManquantes.length || '—'}</td>
            <td class="num">${d.obligations.filter((o) => enRetard(o, now)).length || '—'}</td>
          </tr>`,
        )
        .join('')}
      </tbody>
    </table>
  </section>`;
}

function champ(lib: string, val: string): string {
  return `<div class="champ"><div class="lib">${lib}</div><div class="val">${val}</div></div>`;
}

function fiche(d: DossierRapport, num: number, now: Date): string {
  const s = d.scoring;
  const criteres = s
    ? `<table class="compact">
        <thead><tr><th>Critère de la grille</th><th class="num">Poids</th><th>Constat</th></tr></thead>
        <tbody>
        ${s.criteres
          .map(
            (c) => `<tr class="${c.declenche ? 'declenche' : ''}">
              <td>${e(c.label)}</td>
              <td class="num">${c.poids}</td>
              <td>${c.declenche ? '<span class="puce rouge"></span>Présent' : '<span class="puce gris"></span>Absent'}</td>
            </tr>`,
          )
          .join('')}
        <tr class="total"><td colspan="3">Total : ${s.criteres.filter((c) => c.declenche).reduce((t, c) => t + c.poids, 0)} points sur ${s.criteres.reduce((t, c) => t + c.poids, 0)}, soit un score de <b>${s.score} / 100</b>${s.niveauCalcule ? ` · ` : ''}${s.niveauCalcule ? `niveau calculé : ${NIVEAU[s.niveauCalcule]}` : ''}</td></tr>
        </tbody>
      </table>`
    : '<p class="vide">Aucun scoring calculé pour ce dossier.</p>';

  const office = s?.eleveDOffice.length
    ? `<div class="encart rouge">Risque <b>élevé d’office</b> : ${e(s.eleveDOffice.join(', '))}.</div>`
    : '';
  const ajust = s?.ajustement
    ? `<div class="encart ambre">Niveau ajusté manuellement à <b>${NIVEAU[s.ajustement.niveau]}</b>${s.ajustement.par ? ` par ${e(s.ajustement.par)}` : ''}${s.ajustement.le ? ` le ${date(s.ajustement.le)}` : ''}. Justification : « ${e(s.ajustement.justification)} »</div>`
    : '';

  const risques = d.risques.length
    ? `<table class="compact">
        <thead><tr><th>Risque de la cartographie</th><th class="num">P × I</th><th>Niveau</th></tr></thead>
        <tbody>${d.risques
          .map(
            (r) =>
              `<tr><td>${e(r.libelle)}${r.vigilanceRenforcee ? ' <span class="badge rouge">vigilance renforcée</span>' : ''}</td><td class="num">${r.score}</td><td>${badgeCarto(r.niveau)}</td></tr>`,
          )
          .join('')}</tbody>
      </table>`
    : '<p class="vide">Aucun des 13 risques de la cartographie n’est identifié pour ce dossier.</p>';

  const correspondances = d.gel.correspondances.length
    ? `<table class="compact">
        <thead><tr><th>Personne contrôlée</th><th>Inscrit au registre</th><th>Décision</th><th>Justification</th></tr></thead>
        <tbody>${d.gel.correspondances
          .map(
            (c) => `<tr>
              <td>${e(c.personne)}</td>
              <td>${e(c.nomRegistre)}</td>
              <td><span class="badge ${c.statut === StatutCorrespondance.CONFIRMEE ? 'rouge' : c.statut === StatutCorrespondance.A_VERIFIER ? 'ambre' : 'gris'}">${CORRESPONDANCE[c.statut]}</span></td>
              <td>${c.commentaire ? e(c.commentaire) : '—'}${c.decidePar ? `<div class="petit">${e(c.decidePar)}, le ${date(c.decideLe)}</div>` : ''}</td>
            </tr>`,
          )
          .join('')}</tbody>
      </table>`
    : '';

  const ubos =
    d.typeEntite === TypeEntite.PERSONNE_MORALE
      ? d.ubos.length
        ? `<table class="compact">
            <thead><tr><th>Bénéficiaire effectif</th><th class="num">Détention</th><th>Nationalité</th><th>PPE</th></tr></thead>
            <tbody>${d.ubos
              .map(
                (u) =>
                  `<tr><td>${e(u.nom)}</td><td class="num">${u.pourcentage} %</td><td>${ou(u.nationalite)}</td><td>${u.ppe ? '<span class="badge rouge">Oui</span>' : 'Non'}</td></tr>`,
              )
              .join('')}</tbody>
          </table>`
        : '<div class="encart ambre">Aucun bénéficiaire effectif saisi.</div>'
      : '';

  const pieces = d.piecesManquantes.length
    ? `<div class="encart ambre"><b>Pièces manquantes ou expirées :</b> ${d.piecesManquantes.map((p) => e(PIECE[p] ?? p)).join(', ')}.</div>`
    : '<p class="ok-txt"><span class="puce vert"></span>Toutes les pièces obligatoires sont présentes et valides.</p>';

  const acceptation = d.acceptation
    ? d.acceptation.acceptee
      ? `Décidée le ${date(d.acceptation.decideeLe)}${d.acceptation.decideePar ? ` par ${e(d.acceptation.decideePar)}` : ''}`
      : 'Questionnaire en cours, décision non prise'
    : 'Questionnaire non commencé';

  const missions = d.missions.length
    ? `<table class="compact">
        <thead><tr><th>Mission</th><th>Statut</th><th>Début</th><th class="num">Honoraires</th><th>Lettre de mission</th></tr></thead>
        <tbody>${d.missions
          .map((m) => {
            const l = m.lettre;
            const lettre = !l
              ? '<span class="badge ambre">Non rédigée</span>'
              : l.signeeCabinetLe
                ? `<span class="badge vert">Signée v${l.version}</span> le ${date(l.signeeCabinetLe)}${l.signeeClientLe ? `<div class="petit">Contresignée par le client le ${date(l.signeeClientLe)}</div>` : '<div class="petit">Contreseing client non reçu</div>'}`
                : l.validee
                  ? `<span class="badge ambre">Validée v${l.version}, à signer</span>`
                  : `<span class="badge ambre">Brouillon v${l.version}</span>`;
            return `<tr>
              <td>${e(TYPES_MISSION[m.type]?.libelle ?? m.type)}</td>
              <td>${MISSION_STATUT[m.statut]}</td>
              <td>${date(m.dateDebut)}</td>
              <td class="num">${montant(m.honoraires)}</td>
              <td>${lettre}</td>
            </tr>`;
          })
          .join('')}</tbody>
      </table>`
    : '<p class="vide">Aucune mission.</p>';

  const obligations = d.obligations.length
    ? `<table class="compact">
        <thead><tr><th>Obligation ouverte</th><th>Échéance</th><th>Statut</th></tr></thead>
        <tbody>${d.obligations
          .map((o) => {
            const retard = enRetard(o, now);
            return `<tr class="${retard ? 'declenche' : ''}"><td>${e(OBLIGATION[o.type] ?? o.type)}</td><td>${date(o.echeance)}</td><td>${retard ? '<span class="badge rouge">En retard</span>' : OBLIGATION_STATUT[o.statut]}</td></tr>`;
          })
          .join('')}</tbody>
      </table>`
    : '<p class="ok-txt"><span class="puce vert"></span>Aucune obligation ouverte.</p>';

  return `
  <section class="fiche saut" id="${ancre(d)}">
    <div class="fiche-tete">
      <div>
        <div class="petit">Fiche ${num} · ${e(d.ref)} · ${e(ETAPE[d.etape] ?? d.etape)}</div>
        <div class="fiche-nom">${e(d.nom)}</div>
      </div>
      <div class="fiche-niveau">
        ${badgeNiveau(s?.niveau ?? null, true)}
        ${s ? `<div class="petit">Score ${s.score} / 100 · calculé le ${date(s.calculeLe)}</div>` : ''}
      </div>
    </div>

    <h3>Identification</h3>
    <div class="grille">
      ${champ('Forme', `${forme(d.formeJuridique)}${d.typeEntite === TypeEntite.PERSONNE_PHYSIQUE ? ' (personne physique)' : ''}`)}
      ${champ('SIREN', ou(d.siren))}
      ${champ('Activité', `${ou(d.activite)}${d.codeNaf ? ` (NAF ${e(d.codeNaf)})` : ''}`)}
      ${champ('Représentant légal', ou(d.representantLegal))}
      ${champ('Adresse', `${ou(d.adresse)}${d.pays && d.pays !== 'France' && d.pays !== 'FR' ? `, ${e(d.pays)}` : ''}`)}
      ${champ('Date de création', date(d.dateCreation))}
      ${champ('Chiffre d’affaires', montant(d.chiffreAffaires))}
      ${champ('Effectif', ou(d.effectif))}
      ${d.suiviPar ? champ('Suivi par', e(d.suiviPar)) : ''}
    </div>

    <h3>Évaluation du risque</h3>
    ${office}${ajust}
    <div class="deux-col">
      <div>${criteres}</div>
      <div>${risques}</div>
    </div>

    <h3>Conformité LCB-FT</h3>
    <div class="grille">
      ${champ('KYC', d.kyc ? `${badgeKyc(d.kyc)}${d.kyc.valideLe ? ` le ${date(d.kyc.valideLe)}` : ''}${d.kyc.validePar ? ` par ${e(d.kyc.validePar)}` : ''}` : '<span class="gris-txt">À valider après conversion en client</span>')}
      ${champ('Registre des gels', `${badgeGel(d.screening.statut)}${d.screening.date ? ` · contrôlé le ${date(d.screening.date)}${d.screening.registreDu ? ` (registre DG Trésor du ${date(d.screening.registreDu)})` : ''}` : ''}`)}
      ${champ('Personne politiquement exposée', d.ppe ? `<span class="badge rouge">Oui</span>${d.ppeDetail ? ` ${e(d.ppeDetail)}` : ''}` : 'Non')}
      ${champ('Acceptation de la mission', acceptation)}
    </div>
    ${correspondances}
    ${ubos}
    ${pieces}

    <h3>Missions et lettres de mission</h3>
    ${missions}

    <h3>Obligations</h3>
    ${obligations}
  </section>`;
}

const CSS = `
  * { box-sizing: border-box; }
  body { font-family: "Helvetica Neue", Arial, "DejaVu Sans", sans-serif; color: #1f2937; font-size: 9.5px; line-height: 1.45; margin: 0; }
  a { color: #1e3a8a; text-decoration: none; }
  h1 { font-size: 24px; margin: 4px 0 6px; color: #0f1f4d; letter-spacing: -0.2px; }
  h2 { font-size: 14px; color: #0f1f4d; border-bottom: 1.5px solid #1e3a8a; padding-bottom: 4px; margin: 0 0 10px; }
  h3 { font-size: 10.5px; color: #1e3a8a; text-transform: uppercase; letter-spacing: 0.6px; margin: 14px 0 6px; }
  .saut { page-break-before: always; }
  .couverture { border-bottom: 3px solid #1e3a8a; padding-bottom: 12px; margin-bottom: 16px; }
  .couv-haut { display: flex; align-items: center; gap: 10px; margin-bottom: 18px; }
  .logo { height: 34px; }
  .cabinet { font-size: 12px; font-weight: 700; color: #0f1f4d; }
  .surtitre { font-size: 8.5px; text-transform: uppercase; letter-spacing: 1.2px; color: #64748b; }
  .meta { font-size: 8.5px; color: #475569; }
  .petit { font-size: 8px; color: #64748b; }
  .ref { font-size: 7.5px; color: #64748b; font-family: "DejaVu Sans Mono", monospace; }
  .intro, .legende { font-size: 8.5px; color: #475569; margin: 0 0 8px; }
  .legende { margin-top: 4px; }
  .vide, .gris-txt { color: #94a3b8; }
  .ok-txt { color: #047857; margin: 6px 0; }
  table { width: 100%; border-collapse: collapse; margin: 4px 0 8px; }
  th { text-align: left; font-size: 7.5px; text-transform: uppercase; letter-spacing: 0.4px; color: #64748b; font-weight: 600; border-bottom: 1px solid #cbd5e1; padding: 4px 5px; }
  td { border-bottom: 0.5px solid #e2e8f0; padding: 4px 5px; vertical-align: top; }
  tr { page-break-inside: avoid; }
  .num { text-align: right; white-space: nowrap; }
  tr.declenche td { background: #fef2f2; }
  tr.total td { font-weight: 700; border-top: 1px solid #cbd5e1; border-bottom: none; }
  .badge { display: inline-block; border-radius: 3px; padding: 1px 5px; font-size: 7.5px; font-weight: 700; white-space: nowrap; border: 0.5px solid transparent; }
  .badge.gros { font-size: 11px; padding: 3px 10px; }
  .badge.rouge { background: #fee2e2; color: #b91c1c; border-color: #fecaca; }
  .badge.ambre { background: #fef3c7; color: #b45309; border-color: #fde68a; }
  .badge.vert { background: #d1fae5; color: #047857; border-color: #a7f3d0; }
  .badge.gris { background: #f1f5f9; color: #475569; border-color: #e2e8f0; }
  .puce { display: inline-block; width: 6px; height: 6px; border-radius: 50%; margin-right: 4px; vertical-align: middle; }
  .puce.rouge { background: #dc2626; } .puce.vert { background: #059669; } .puce.gris { background: #cbd5e1; }
  .kpis { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; margin-bottom: 6px; }
  .kpi { border: 0.5px solid #cbd5e1; border-radius: 4px; padding: 6px 8px; }
  .kpi.alerte { border-color: #fca5a5; background: #fef2f2; }
  .kpi-val { font-size: 16px; font-weight: 700; color: #0f1f4d; }
  .kpi.alerte .kpi-val { color: #b91c1c; }
  .kpi-lib { font-size: 8px; color: #475569; }
  .repartition { display: flex; height: 10px; border-radius: 3px; overflow: hidden; margin: 4px 0 8px; background: #f1f5f9; }
  .seg.rouge { background: #ef4444; } .seg.ambre { background: #f59e0b; } .seg.vert { background: #10b981; } .seg.gris { background: #cbd5e1; }
  .points { margin: 0; padding-left: 14px; columns: 2; column-gap: 18px; }
  .points li { margin-bottom: 3px; break-inside: avoid; }
  .matrice { table-layout: fixed; }
  .matrice th.axe { width: 70px; vertical-align: middle; text-transform: none; font-size: 8.5px; color: #334155; border: none; }
  .matrice th.axe-bas { text-align: center; text-transform: none; font-size: 8.5px; color: #334155; border: none; }
  .matrice td.case { height: 62px; border: 2px solid #fff; padding: 4px; }
  .case.rouge { background: #fee2e2; } .case.ambre { background: #fef3c7; } .case.vert { background: #d1fae5; }
  .risque-case { background: #fff; border-radius: 3px; padding: 1px 4px; margin-bottom: 2px; font-size: 7.5px; }
  .fiche-tete { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; background: #f1f5fb; border-left: 4px solid #1e3a8a; padding: 8px 10px; margin-bottom: 4px; }
  .fiche-nom { font-size: 16px; font-weight: 700; color: #0f1f4d; }
  .fiche-niveau { text-align: right; }
  .grille { display: grid; grid-template-columns: 1fr 1fr; gap: 3px 16px; }
  .champ { display: flex; gap: 6px; border-bottom: 0.5px solid #f1f5f9; padding: 2px 0; }
  .champ .lib { width: 38%; color: #64748b; flex-shrink: 0; }
  .champ .val { flex: 1; }
  .deux-col { display: grid; grid-template-columns: 1.15fr 1fr; gap: 12px; }
  .encart { border-radius: 4px; padding: 5px 8px; margin: 6px 0; }
  .encart.rouge { background: #fef2f2; border: 0.5px solid #fecaca; color: #991b1b; }
  .encart.ambre { background: #fffbeb; border: 0.5px solid #fde68a; color: #92400e; }
  .sommaire td { vertical-align: middle; }
`;

export function construireRapportHtml(r: DonneesRapport): string {
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Cartographie des risques</title><style>${CSS}</style></head><body>
    ${entete(r)}
    ${synthese(r)}
    ${matrice(r)}
    ${sommaire(r)}
    ${r.dossiers.map((d, i) => fiche(d, i + 1, r.genereLe)).join('')}
  </body></html>`;
}

export function piedDePageRapport(r: DonneesRapport): string {
  return `<div style="font-size:7px;width:100%;color:#64748b;padding:0 14mm;display:flex;justify-content:space-between;">
    <span>${e(r.cabinet.nom)} · Cartographie des risques LCB-FT · ${date(r.genereLe)} · Confidentiel</span>
    <span>Page <span class="pageNumber"></span> / <span class="totalPages"></span></span>
  </div>`;
}

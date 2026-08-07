import { LettreMissionContenu } from '../lettre-mission-data.util';
import { TypeMission } from '../../common/enums';
import {
  REPARTITION_TRAVAUX_CATALOGUE,
  resoudreAssignation,
  AssignationTache,
} from '../../common/repartition-travaux';

export interface LettreMissionSignature {
  signee: boolean;
  nom?: string;
  date?: string;
  imageDataUri?: string | null;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function field(label: string, value: string): string {
  const safe = value ? escapeHtml(value) : '';
  return `
    <div class="field">
      <span class="field-label">${escapeHtml(label)}</span>
      <span class="field-value">${safe || '&nbsp;'}</span>
    </div>`;
}

// Variante pour les champs indispensables à la lettre de mission (régime
// fiscal, TVA, capital social…) : signale visuellement au lieu de laisser
// une ligne vide silencieuse quand la donnée n'a pas encore été saisie sur
// la fiche client/prospect.
function fieldRequis(label: string, value: string): string {
  const safe = value ? escapeHtml(value) : '';
  return `
    <div class="field">
      <span class="field-label">${escapeHtml(label)}</span>
      <span class="field-value${safe ? '' : ' missing'}">${safe || '⚠ À compléter'}</span>
    </div>`;
}

function checkbox(checked: boolean): string {
  return `<span class="chk${checked ? ' checked' : ''}"></span>`;
}

function renderRepartitionTable(
  assignations: LettreMissionContenu['mission']['repartitionTravaux'],
): string {
  return REPARTITION_TRAVAUX_CATALOGUE.map(
    (cat) => `
    <h3>${escapeHtml(cat.titre)}</h3>
    <table class="repartition">
      <thead>
        <tr>
          <th>Tâche</th>
          <th>Cabinet</th>
          <th>Client</th>
          <th>N.A.</th>
        </tr>
      </thead>
      <tbody>
        ${cat.lignes
          .map((l) => {
            const assignation: AssignationTache = resoudreAssignation(
              l.id,
              assignations,
              l.defaut,
            );
            return `
        <tr>
          <td>${escapeHtml(l.tache)}</td>
          <td class="chk-cell">${checkbox(assignation === 'CABINET')}</td>
          <td class="chk-cell">${checkbox(assignation === 'CLIENT')}</td>
          <td class="chk-cell">${checkbox(assignation === 'NA')}</td>
        </tr>`;
          })
          .join('')}
      </tbody>
    </table>`,
  ).join('');
}

function renderNatureEtObjectif(contenu: LettreMissionContenu): string {
  const { mission } = contenu;

  if (mission.type === TypeMission.COMPTABILITE) {
    return `
<p>
  Il s'agit d'une mission d'assurance de niveau modéré aboutissant à une opinion exprimée sous
  une forme négative portant sur la cohérence et la vraisemblance des comptes de votre entité
  pris dans leur ensemble ; le niveau d'assurance est inférieur à celui d'un audit ou d'un
  examen limité. Elle consiste à exprimer une opinion sur la cohérence et la vraisemblance des
  comptes de votre entité. Cette mission n'a pas pour objectif de déceler des erreurs, actes
  illégaux ou autres irrégularités pouvant ou ayant eu lieu dans votre entité.
</p>`;
  }

  return `
<p>
  Nos travaux seront adaptés à la nature de la mission ${escapeHtml(mission.typeLabel)} qui
  nous est confiée${mission.description ? ' et décrite ci-après' : ''}.
</p>
${mission.description ? `<p>${escapeHtml(mission.description)}</p>` : ''}`;
}

function renderEtendueTravaux(contenu: LettreMissionContenu): string {
  const { cabinet, mission } = contenu;

  if (mission.type === TypeMission.COMPTABILITE) {
    return `
<p>
  La répartition des travaux entre votre entreprise et notre cabinet est détaillée au point 3
  de cette lettre de mission. Il est bien entendu que la mission pourra, sur votre demande,
  être complétée par d'autres interventions comptables complémentaires et par une assistance en
  matière fiscale, sociale, juridique, économique, financière ou de gestion.
</p>`;
  }

  return `
<p>
  La répartition des travaux entre le Client et ${escapeHtml(cabinet.nom)} pour cette mission
  ${mission.typeLabel ? escapeHtml(mission.typeLabel) : ''} est précisée au point 3 de cette
  lettre de mission.
</p>`;
}

function renderLimitesTravaux(contenu: LettreMissionContenu): string {
  const { mission } = contenu;

  if (mission.type === TypeMission.COMPTABILITE) {
    return `
<p>
  Nos travaux consisteront à vous assister pour la clôture des comptes et leur présentation
  d'ensemble ; ils comprennent notamment une prise de connaissance globale, une appréciation des
  procédures élémentaires d'organisation comptable, une appréciation de la régularité formelle
  de la comptabilité, une collecte des éléments concourant aux écritures d'inventaire de fin
  d'exercice, une justification des soldes et des contrôles de cohérences des principaux
  comptes, un examen critique des comptes pris dans leur ensemble, des entretiens avec la
  direction. Ils ont pour objectif de nous permettre d'exprimer une assurance de niveau modéré
  sur la cohérence et la vraisemblance des comptes annuels. Ils ne comprennent pas le contrôle
  de la matérialité des opérations, des inventaires physiques des actifs de votre entité à la
  clôture de l'exercice comptable (stocks, immobilisation, espèces en caisse notamment), le
  recours à la procédure de confirmation de soldes auprès de tiers par voie de confirmations
  directes et l'appréciation des procédures de contrôle interne. Nous vous précisons que nous
  sommes juridiquement redevables d'une simple obligation de moyens. Par conséquent, la
  vérification des écritures et leur rapprochement avec les pièces justificatives sont
  effectués par notre cabinet uniquement par épreuves, et ne portent donc pas sur
  l'appréciation de la légalité et de la fiabilité des documents présentés.
</p>`;
  }

  return `
<p>
  Nos travaux seront exécutés conformément aux normes professionnelles applicables à ce type de
  mission et dans les limites qui vous auront été précisées lors de nos échanges préalables.
</p>`;
}

function renderAttestationConclusion(contenu: LettreMissionContenu): string {
  if (contenu.mission.type !== TypeMission.COMPTABILITE) return '';

  return `
<p>
  À l'issue de nos travaux, nous établirons une attestation sur les comptes annuels de votre
  entité à laquelle les comptes considérés seront annexés.
</p>`;
}

function renderRepartitionSection(contenu: LettreMissionContenu): string {
  const { mission } = contenu;

  return renderRepartitionTable(mission.repartitionTravaux);
}

function renderSignatureBlock(
  contenu: LettreMissionContenu,
  signature: LettreMissionSignature,
): string {
  const { cabinet } = contenu;

  return `
<div class="signatures">
  <div class="signature-block">
    <div class="titre">L'expert-comptable</div>
    <div class="sous-titre">${escapeHtml(cabinet.raisonSociale)}</div>
    ${
      signature.signee
        ? `${
            signature.imageDataUri
              ? `<img class="signee-image" src="${signature.imageDataUri}" alt="Signature de ${escapeHtml(signature.nom ?? '')}" />`
              : `<div class="signee">${escapeHtml(signature.nom ?? '')}</div>`
          }
           <div class="note">Signé électroniquement le ${escapeHtml(signature.date ?? '')}</div>`
        : ''
    }
  </div>
  <div class="signature-block">
    <div class="titre">Le Client</div>
    <div class="sous-titre">&nbsp;</div>
    <div class="note">(signature précédée de la mention : Lu et approuvé)</div>
    <span style="font-size:1px;color:#ffffff;">/sig-client/</span>
  </div>
</div>`;
}

export function renderLettreMissionHtml(
  contenu: LettreMissionContenu,
  signature: LettreMissionSignature,
  logoDataUri?: string | null,
): string {
  const { cabinet, client, mission } = contenu;

  const dureeLabel = mission.dateFinLong
    ? `pour la période allant du ${escapeHtml(mission.dateDebut)} au ${escapeHtml(mission.dateFin)}`
    : `à compter du ${escapeHtml(mission.dateDebut)}, pour une durée indéterminée`;

  const exerciceLabel = mission.dateFinLong
    ? `l'exercice allant du ${escapeHtml(mission.dateDebutLong)} au ${escapeHtml(mission.dateFinLong)}`
    : `l'exercice en cours à compter du ${escapeHtml(mission.dateDebutLong)}`;

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8" />
<style>
  * { box-sizing: border-box; }
  body {
    font-family: "Helvetica Neue", Arial, sans-serif;
    font-size: 10.5px;
    color: #1a1a1a;
    line-height: 1.5;
  }
  h1 { font-size: 15px; margin: 0 0 4px; text-transform: uppercase; }
  h2 {
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    color: #1e3a8a;
    border-bottom: 1px solid #1e3a8a;
    padding-bottom: 4px;
    margin: 22px 0 10px;
    page-break-after: avoid;
  }
  h3 { font-size: 10.5px; margin: 14px 0 4px; text-transform: uppercase; page-break-after: avoid; }
  p, li { orphans: 3; widows: 3; page-break-inside: avoid; }
  .field, .signature-block, .fields-grid { page-break-inside: avoid; }
  table.repartition thead { display: table-header-group; }
  table.repartition tr { page-break-inside: avoid; }
  .annexe { page-break-before: always; }
  /* Les clauses de l'annexe (ex. « Obligations de l'expert-comptable »,
     « Obligations du client ») sont trop longues pour tenir sur une seule
     page — le page-break-inside: avoid hérité de la règle "p, li" ci-dessus
     forçait alors le renvoi de la clause entière en bloc sur la page
     suivante, laissant un blanc et un saut de page injustifié entre deux
     items. On les laisse ici se répartir normalement sur plusieurs pages. */
  .annexe li { page-break-inside: auto; }
  .annexe ul { margin: 6px 0 6px 18px; padding: 0; }
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 3px solid #1e3a8a;
    padding-bottom: 10px;
    margin-bottom: 18px;
  }
  .header .cabinet-identite { display: flex; align-items: center; gap: 10px; }
  .header .cabinet-logo { width: 36px; height: 36px; object-fit: contain; }
  .header .cabinet-nom { font-size: 18px; font-weight: 700; color: #1e3a8a; }
  .lieu-date { text-align: right; margin-bottom: 18px; }
  .objet { font-weight: 700; margin: 14px 0; }
  .fields-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 3px 20px;
  }
  .field { display: flex; border-bottom: 1px dotted #ccc; padding: 3px 0; }
  .field-label { width: 50%; color: #555; font-weight: 600; }
  .field-value { flex: 1; }
  .field-value.missing { color: #b45309; font-weight: 600; font-style: italic; }
  p { margin: 7px 0; text-align: justify; }
  table.repartition {
    width: 100%;
    border-collapse: collapse;
    margin: 6px 0 12px;
    font-size: 9.5px;
  }
  table.repartition th, table.repartition td {
    border: 1px solid #ccc;
    padding: 4px 6px;
    text-align: left;
  }
  table.repartition th { background: #f1f5f9; }
  td.chk-cell { text-align: center; width: 40px; }
  .chk {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 11px;
    height: 11px;
    border: 1px solid #333;
    border-radius: 2px;
    position: relative;
  }
  .chk.checked::after {
    content: '\\2713';
    font-size: 9px;
    line-height: 1;
    font-weight: 700;
    color: #1e293b;
  }
  .signatures {
    display: flex;
    justify-content: space-between;
    margin-top: 24px;
    gap: 30px;
  }
  .signature-block { flex: 1; }
  .signature-block .titre { font-weight: 700; margin-bottom: 4px; }
  .signature-block .sous-titre { margin-bottom: 14px; }
  .signature-block .signee {
    font-family: "Brush Script MT", cursive;
    font-size: 17px;
    color: #1e3a8a;
  }
  .signature-block .signee-image { max-height: 44px; max-width: 180px; object-fit: contain; }
  .signature-block .note { font-size: 9px; color: #777; margin-top: 4px; }
  .annexe ol { padding-left: 18px; }
  .annexe li { margin-bottom: 9px; text-align: justify; }
</style>
</head>
<body>

<div class="header">
  <div class="cabinet-identite">
    ${logoDataUri ? `<img class="cabinet-logo" src="${logoDataUri}" alt="${escapeHtml(cabinet.nom)}" />` : ''}
    <div class="cabinet-nom">${escapeHtml(cabinet.nom)}</div>
  </div>
  <div>${escapeHtml(cabinet.formeJuridique)}</div>
</div>

<div class="lieu-date">${escapeHtml(cabinet.ville)}, le ${escapeHtml(contenu.dateGenerationLong)}</div>

<div class="objet">Objet : Lettre de mission</div>

<p>Madame, Monsieur,</p>

<p>
  Nous vous remercions de la confiance que vous nous avez témoignée en envisageant de nous
  confier, en qualité d'expert-comptable, une mission ${
    mission.typeLabel ? escapeHtml(mission.typeLabel) : ''
  } de votre entité ${dureeLabel}.
</p>
<p>
  La présente lettre de mission est un contrat établi afin de se conformer aux dispositions de
  l'article 151 du Code de déontologie intégré au décret du 30 mars 2012 relatif à l'exercice de
  l'activité d'expertise comptable. Elle a pour objet de vous confirmer par écrit les termes et
  les objectifs de notre mission tels que nous les avons fixés lors de notre dernier entretien à
  ce sujet, ainsi que la nature et les limites de celle-ci.
</p>

<h2>1. Votre entité</h2>
<div class="fields-grid">
  ${field('Raison sociale', client.raisonSociale)}
  ${field('Forme juridique', client.formeJuridique)}
  ${field('Siège social', client.adresse)}
  ${fieldRequis('Capital social', client.capitalSocial)}
  ${field('Gérant', client.gerant)}
  ${field('Siret', client.siret)}
  ${field('Code activité', client.codeNaf)}
  ${field('Activité principale', client.activitePrincipale)}
  ${field('Adresse courriel', client.email)}
  ${fieldRequis('Régime fiscal', client.regimeFiscal)}
  ${fieldRequis('Régime TVA', client.regimeTva)}
  ${fieldRequis('N° TVA intracommunautaire', client.tvaIntracommunautaire)}
  ${fieldRequis('Existence de salariés', client.existenceSalaries)}
  ${
    // Sans objet si l'entité n'a pas de salarié — à ne pas confondre avec
    // une donnée simplement pas encore saisie (cf. fieldRequis ci-dessus).
    client.existenceSalaries === 'Non'
      ? field('Convention collective appliquée', 'Sans objet')
      : fieldRequis(
          'Convention collective appliquée',
          client.conventionCollective,
        )
  }
</div>

<h2>2. Notre mission</h2>
<p>
  La mission que vous envisagez de nous confier sera effectuée dans le respect des dispositions
  de la norme professionnelle du Conseil Supérieur de l'Ordre des Experts-Comptables applicable
  à ce type de mission, ainsi que des textes légaux et réglementaires applicables aux
  experts-comptables que nous sommes tenus de respecter.
</p>
<p>
  Nous nous permettons d'attirer votre attention sur le fait que, conformément à l'article
  L. 123-14 du Code de commerce, les comptes annuels doivent être réguliers, sincères et donner
  une image fidèle du patrimoine, de la situation financière et du résultat de votre entité. Vous
  restez ainsi responsable à l'égard des tiers de l'exhaustivité, de la fiabilité et de
  l'exactitude des informations comptables et financières concourant à la présentation des
  comptes, ainsi que des procédures de contrôle interne concourant à l'élaboration de ces
  comptes.
</p>
<h3>2.1. Durée de la mission</h3>
<p>
  La mission est conclue pour une durée d'une année correspondant à l'exercice comptable. Elle
  est renouvelable chaque année par tacite reconduction, sauf dénonciation par lettre
  recommandée avec accusé de réception trois mois avant la date de clôture de l'exercice
  comptable.
</p>

<h3>2.2. Nature et objectif de la mission</h3>
${renderNatureEtObjectif(contenu)}

<h3>2.3. Étendue de nos travaux</h3>
${renderEtendueTravaux(contenu)}

<h3>2.4. Nature et limites des travaux à mettre en œuvre</h3>
${renderLimitesTravaux(contenu)}

<h3>2.5. Exécution et déroulement de la mission</h3>
<p>
  Notre mission sera exécutée sous la direction d'un expert-comptable du cabinet, qui pourra se
  faire assister en cas de besoin par d'autres collaborateurs. Nous comptons sur votre
  coopération pour nous communiquer les informations et documents nécessaires à la bonne
  exécution de notre mission.
</p>
${renderAttestationConclusion(contenu)}

<h3>2.6. Modalités relationnelles</h3>
<p>
  Nos relations seront réglées sur le plan juridique tant par les termes de cette lettre de
  mission que par les conditions générales établies par notre profession, ainsi que par un
  tableau de répartition des obligations respectives entre votre entité et notre cabinet afin de
  réaliser cette mission dans des conditions optimales.
</p>
<p>
  Tout aménagement devant éventuellement être apporté à la mission définie ci-dessus sera
  préalablement arrêté d'un commun accord et fera l'objet d'un avenant à la présente lettre de
  mission.
</p>

<h3>2.7. Obligations d'identification</h3>
<p>
  Dans le cadre des obligations qui nous incombent en application des dispositions du Code
  monétaire et financier relatives à la lutte contre le blanchiment de capitaux et le
  financement du terrorisme, nous vous informons qu'à la date de la présente, les informations
  et documents requis en matière d'identification et relatés au paragraphe 6 des conditions
  générales jointes à la présente ne nous sont pas parvenus, et que leur obtention est une
  condition suspensive à la mise en œuvre de la mission que vous souhaitez nous confier.
</p>

<h2>3. Répartition des travaux</h2>
${renderRepartitionSection(contenu)}

<h2>4. Honoraires, règlements, signatures</h2>

<h3>4.1. Honoraires</h3>
<p>
  Nos honoraires seront calculés sur la base des temps passés par notre cabinet, augmentés des
  frais et débours divers. Les taux horaires appliqués varient en fonction de la mission
  confiée, de l'expérience et des compétences requises des intervenants sur la mission.
</p>
<p>
  Pour ${exerciceLabel}, ils sont fixés comme suit :
</p>
<div class="fields-grid">
  ${field(`Mission ${mission.typeLabel || 'confiée'}`, mission.honoraires)}
  ${field('Frais de débours en sus', '5% HT')}
</div>
<p>
  Nous attirons votre attention sur le fait que toute mission sortant du cadre de nos travaux
  définis dans l'annexe jointe fera l'objet d'un budget complémentaire et vous sera facturée
  séparément. En cas de dépassement des temps prévus (travaux complémentaires exceptionnels non
  compris dans le paragraphe 2.3 Étendue de nos travaux), une régularisation des honoraires
  pourra être facturée en fin d'exercice. Ces honoraires n'incluent pas les éventuelles demandes
  d'attestations particulières que vous pourriez formuler au cours de la période en liaison avec
  notre mission principale.
</p>

<h3>4.2. Facturation et règlement des honoraires</h3>
<p>
  Nous vous proposons d'établir une facture annuelle. Nous vous proposons de régler les
  honoraires au comptant, par virement bancaire.
</p>

<h3>4.3. Signatures</h3>
<p>
  Si les conditions définies ci-dessus sont à votre convenance, nous vous serions obligés de bien
  vouloir nous retourner un exemplaire de la présente et de son annexe 1 (conditions générales),
  qui en fait partie intégrante, revêtus de votre signature.
</p>
<p>
  En vous remerciant de la confiance que vous nous témoignez, nous vous prions d'agréer,
  Madame, Monsieur, l'expression de nos meilleurs sentiments.
</p>
<p>
  Fait à ${escapeHtml(cabinet.ville)}, le ${escapeHtml(contenu.dateGenerationLong)}, en deux
  exemplaires originaux, dont un remis au client.
</p>

${renderSignatureBlock(contenu, signature)}

<div class="annexe">
<h1>Annexe 1 — Conditions générales</h1>
<ol>
  <li><strong>Domaine d'application.</strong> Les présentes conditions sont applicables aux
  conventions portant sur les missions conclues entre le cabinet ${escapeHtml(cabinet.nom)},
  dénommé l'expert-comptable, et son client.</li>
  <li><strong>Définition de la mission.</strong> Les travaux incombant à l'expert-comptable sont
  détaillés dans la lettre de mission et ses annexes et sont strictement limités à son contenu.
  Toute mission ou prestation complémentaire devra faire l'objet d'une information préalable du
  client afin que celui-ci soit en mesure de manifester son accord.</li>
  <li><strong>Résiliation de la mission.</strong> En cas de résiliation au cours d'un exercice
  comptable, et sauf faute grave imputable à l'expert-comptable, le client devra verser à ce
  dernier les honoraires dus pour le travail déjà effectué, majorés d'une indemnité
  conventionnelle égale à 33,33 % des honoraires annuels convenus pour l'exercice en cours ou de
  la dernière année d'honoraires en cas de montant incertain. Cette indemnité est destinée à
  compenser le préjudice subi par l'expert-comptable à raison de l'inclusion du dossier du client
  dans sa charge de travail de l'année en cours. En cas de manquement du client à l'une de ses
  obligations, l'expert-comptable aura la faculté de suspendre sa mission en informant ce dernier
  par tout moyen écrit, ou de mettre fin à sa mission après envoi d'une lettre recommandée
  demeurée sans effet.</li>
  <li><strong>Suspension de la mission.</strong> Lorsque la mission est suspendue pour cause de
  force majeure ou de défaut de paiement des honoraires, les délais de remise des travaux sont
  prolongés d'une durée égale à celle de la suspension susvisée. Pendant la période de suspension
  éventuelle, toutes les dispositions du contrat demeurent applicables.</li>
  <li><strong>Obligations de l'expert-comptable.</strong> L'expert-comptable effectue la mission
  qui lui est confiée conformément aux dispositions du Code de déontologie intégré au décret du
  30 mars 2012 relatif à l'exercice de l'activité d'expertise comptable, de la norme de « maîtrise
  de la qualité », de la norme « anti-blanchiment » élaborée en application des dispositions du
  Code monétaire et financier et, le cas échéant, de la norme professionnelle de travail
  spécifique à la mission considérée. Il contracte, en raison de cette mission, une obligation de
  moyens. L'expert-comptable peut se faire assister par les collaborateurs de son choix. À
  l'achèvement de sa mission, l'expert-comptable restitue les documents que lui a confiés le
  client pour l'exécution de la mission. L'expert-comptable est tenu à la fois au secret
  professionnel dans les conditions prévues à l'article 226-13 du Code pénal, et à une obligation
  de discrétion, distincte de l'obligation précédente, quant aux informations recueillies et à la
  diffusion des documents qu'il a établis. Les documents établis par l'expert-comptable seront en
  conséquence adressés au client, à l'exclusion de tout envoi direct à un tiers (sauf instruction
  spécifique de la part du client et exception faite des transmissions aux administrations
  fiscales et sociales et OGA).</li>
  <li><strong>Obligations du client.</strong> Le client s'interdit tout acte de nature à porter
  atteinte à l'indépendance de l'expert-comptable ou de ses collaborateurs. Ceci s'applique
  particulièrement aux offres faites à des collaborateurs d'exécuter des missions pour leur
  propre compte ou de devenir salarié du client.
  <br />Le client s'engage :
  <ul>
    <li>à fournir à l'expert-comptable, préalablement au commencement de la mission, les
    informations et documents d'identification requis en application des dispositions visées aux
    articles L. 561-1 et suivants du Code monétaire et financier, à savoir, dans le cadre de
    l'obligation d'identification du client : si le client est une personne physique, un document
    d'identité officiel en cours de validité comportant sa photographie ; si le client est une
    personne morale, tout acte ou extrait de registre officiel datant de moins de trois mois
    constatant la dénomination, la forme juridique, l'adresse du siège social, l'identité des
    associés et dirigeants et la composition et la répartition du capital ; et, dans le cadre de
    l'obligation d'identification du bénéficiaire effectif, s'il apparaît qu'une personne physique
    remplit les conditions pour être qualifiée de bénéficiaire effectif, les éléments
    d'identification de cette personne ;</li>
    <li>à mettre à la disposition de l'expert-comptable, dans les délais convenus, l'ensemble des
    documents et informations nécessaires à l'exécution de la mission ;</li>
    <li>à réaliser les travaux lui incombant conformément aux dispositions prévues dans le tableau
    de répartition des obligations respectives ;</li>
    <li>à respecter les procédures mises en place pour la réalisation de la mission et notamment
    le planning d'intervention de l'expert-comptable ;</li>
    <li>à porter à la connaissance de l'expert-comptable les faits nouveaux ou exceptionnels, et à
    lui signaler les engagements susceptibles d'affecter les résultats ou la situation
    patrimoniale de l'entité ;</li>
    <li>à confirmer par écrit, si l'expert-comptable le lui demande, que les documents,
    renseignements et explications fournis sont exhaustifs et reflètent fidèlement la situation
    patrimoniale de l'entité ;</li>
    <li>à vérifier que les états et documents produits par l'expert-comptable sont conformes aux
    demandes exprimées et aux informations fournies par lui-même, et à informer sans retard le
    professionnel de tout manquement ou erreur.</li>
  </ul>
  Le client reste responsable de la bonne application de la législation et des règlements en
  vigueur ; l'expert-comptable ne peut être considéré comme se substituant aux obligations du
  client du fait de cette mission. Conformément aux prescriptions légales, le client doit prendre
  toutes les mesures nécessaires pour conserver les pièces justificatives et, d'une façon
  générale, l'ensemble des documents produits par l'expert-comptable pendant les délais de
  conservation requis par la loi ou le règlement. Dès lors que des traitements sont assurés sur le
  système informatique du client, ce dernier devra assurer la sauvegarde et l'archivage des
  données et des traitements informatisés pour en garantir la conservation, l'inviolabilité et la
  lecture ultérieure. D'une façon générale, le client doit par ailleurs prendre toutes les mesures
  nécessaires pour assurer la protection de son système informatique. Enfin, en matière de
  règlementation générale de protection des données (RGPD), le client reconnaît que, dans le cadre
  de cette mission, le cabinet ${escapeHtml(cabinet.nom)} intervient en tant que
  sous-traitant.</li>
  <li><strong>Honoraires.</strong> L'expert-comptable reçoit du client des honoraires librement
  convenus qui sont exclusifs de toute autre rémunération, même indirecte. Il est remboursé de
  ses frais de déplacement et débours. Des provisions sur honoraires sont demandées
  périodiquement. Les honoraires sont payés à leur date d'échéance ; en cas de paiement anticipé,
  aucun escompte n'est accordé ; en cas de retard de paiement, des pénalités de retard sont
  exigibles le jour suivant la date de règlement figurant sur la facture, sans qu'un rappel soit
  nécessaire ; sauf disposition contraire, le taux d'intérêt de ces pénalités sera égal à celui
  appliqué par la Banque Centrale Européenne à son opération de refinancement la plus récente
  majoré de 10 points de pourcentage, sans pouvoir être inférieur à trois fois le taux d'intérêt
  légal. Une indemnité forfaitaire pour frais de recouvrement d'un montant de 40 euros est
  également exigible de plein droit en cas de retard de paiement ; lorsque les frais de
  recouvrement exposés sont supérieurs au montant de cette indemnité forfaitaire, une
  indemnisation complémentaire peut être réclamée sur justificatifs. Toute contestation d'une
  facture devra être faite dès réception et motivée ; ladite contestation ne pourra justifier le
  non-paiement des autres prestations non contestées, y compris celles incluses dans la même
  facture. Le non-paiement des honoraires pourra, après rappel par lettre recommandée avec accusé
  de réception, entraîner la suspension des travaux ou mettre fin à la mission. En cas de
  changement de modalités de facturation, une information préalable sera donnée au client. En cas
  de rupture du contrat par l'une ou l'autre des parties, une assistance pour réaliser le
  transfert du dossier dans l'entreprise ou à un nouveau prestataire pourra être effectuée à la
  demande du client sur la base d'un devis préalablement accepté. En cas d'usage du droit de
  rétention prévu à l'article 168 du Code de déontologie intégré au décret du 30 mars 2012 relatif
  à l'exercice de l'activité d'expertise comptable, le président du Conseil régional de l'Ordre
  des Experts-Comptables sera informé.</li>
  <li><strong>Responsabilité civile.</strong> En application de l'article 2254 modifié du Code
  civil, la responsabilité civile de l'expert-comptable ne peut être mise en jeu que sur une
  période contractuellement définie à une année à compter des événements ayant causé un préjudice
  à l'entreprise. Tout événement susceptible d'entraîner des conséquences notamment en matière de
  responsabilité doit être porté sans délai par le client à la connaissance de
  l'expert-comptable. La responsabilité civile professionnelle de l'expert-comptable est couverte
  par un contrat d'assurance souscrit auprès de la compagnie GENERALI à Paris (75009). La
  responsabilité de l'expert-comptable ne peut notamment être engagée dans l'hypothèse où le
  préjudice subi par le client est une conséquence d'une information erronée ou d'une faute ou
  négligence commise par le client ou par ses salariés, du retard ou de la carence du client à
  fournir une information nécessaire à l'expert-comptable, ou de fautes commises par des tiers
  intervenant chez le client.</li>
  <li><strong>Différends.</strong> Les litiges qui pourraient éventuellement survenir entre
  l'expert-comptable et son client seront portés, avant toute action judiciaire, devant le
  président du Conseil régional de l'Ordre compétent ou son représentant aux fins de conciliation,
  à l'exception des litiges dont l'expert-comptable souhaiterait qu'ils soient couverts par son
  assurance RCP.</li>
  <li><strong>Droit applicable et attribution de compétence.</strong> Ce contrat de mission sera
  régi et interprété selon le droit français. Tous les litiges auxquels le contrat pourra donner
  lieu, notamment au sujet de sa validité, de son interprétation, de son exécution et de sa
  réalisation, seront soumis aux tribunaux compétents.</li>
  <li><strong>Acceptation des conditions générales d'intervention.</strong> Le client reconnaît
  avoir reçu, pris connaissance et accepté les présentes conditions générales d'intervention.</li>
</ol>

<p>
  Fait à ${escapeHtml(cabinet.ville)}, le ${escapeHtml(contenu.dateGenerationLong)}, en deux
  exemplaires originaux, dont un remis au client.
</p>

${renderSignatureBlock(contenu, signature)}
</div>

</body>
</html>`;
}

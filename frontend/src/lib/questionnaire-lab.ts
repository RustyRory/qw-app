// Questionnaire LAB (lutte anti-blanchiment) : liste des questions,
// partagée entre la page du questionnaire et la fiche client.
export type Reponses = Record<string, string>;
export type QuestionKind = "oui_non" | "seuil" | "pct";

export type Question = {
  id: string;
  text: string;
  kind: QuestionKind;
  seuilRM?: string;
  seuilRE?: string;
};

export type QuestionGroup = {
  label?: string;
  // Lien de référence affiché à côté du titre du groupe.
  lien?: { href: string; texte: string };
  questions: Question[];
};
export type QModule = {
  id: string;
  num: number;
  title: string;
  groups: QuestionGroup[];
};

export const PCT_OPTIONS = [
  { value: "0", label: "0 %" },
  { value: "lt5", label: "Moins de 5 %" },
  { value: "5-10", label: "De 5 à 10 %" },
  { value: "11-20", label: "De 11 à 20 %" },
  { value: "gt20", label: "Plus de 20 %" },
];

export const MODULES: QModule[] = [
  {
    id: "d1",
    num: 1,
    title: "Caractéristiques des clients",
    groups: [
      {
        questions: [
          {
            id: "D1_1",
            kind: "oui_non",
            text: "Association culturelle, cultuelle ou à vocation humanitaire recevant des fonds de l'étranger ou versant des fonds vers l'étranger ?",
          },
          {
            id: "D1_2",
            kind: "oui_non",
            text: "Association dirigée par un élu ou un membre de sa famille et recevant des subventions publiques pour un montant annuel supérieur à 25 k€ de la collectivité dont il est élu ?",
          },
          { id: "D1_3", kind: "oui_non", text: "Parti politique ?" },
          {
            id: "D1_4",
            kind: "oui_non",
            text: "Société membre d'un groupe utilisant une superposition d'entités juridiques étrangères qui complexifie l'identification de l'origine des fonds ou du bénéficiaire effectif ?",
          },
          {
            id: "D1_5",
            kind: "oui_non",
            text: "Fiducie ou société membre d'un groupe où l'on constate la présence d'une fiducie ou d'un trust ?",
          },
          {
            id: "D1_6",
            kind: "oui_non",
            text: "Société ayant recours à des montages fiscaux complexes, transnationaux ou non, mis en place par la structure d'exercice professionnel ou non, que cette dernière ait fait une déclaration DAC6 ou non ?",
          },
          {
            id: "D1_7",
            kind: "oui_non",
            text: "Société contrôlée par une personne physique qui contrôle par ailleurs d'autres sociétés (hors SCI, sociétés civiles immobilières) dont votre structure d'exercice professionnel n'est pas l'expert-comptable, qui n'ont pas de lien juridique avec la première, mais qui entretiennent avec elle des liens économiques ?",
          },
          {
            id: "D1_8",
            kind: "oui_non",
            text: "Société à prépondérance immobilière détenue via une cascade de véhicules étrangers non régulés ou via un fonds d'investissement alternatif (au sens de la directive AIFM) ?",
          },
          {
            id: "D1_9",
            kind: "oui_non",
            text: "Société ou personne physique détenant un/des biens immobiliers de prestige ou de luxe, notamment situés dans des emplacements connus pour être des zones où se concentrent les biens immobiliers de prestige ou de luxe (valeur vénale unitaire supérieure à 3 millions d'euros, hors immobilier professionnel) ?",
          },
          {
            id: "D1_10",
            kind: "oui_non",
            text: "Société ayant son siège social dans une société de domiciliation autre que la structure d'exercice professionnel de l'expert-comptable ?",
          },
          {
            id: "D1_11",
            kind: "oui_non",
            text: "Client, représentant légal ou bénéficiaire effectif ayant le statut de PPE (personne politiquement exposée) en France ou à l'étranger ?",
          },
        ],
      },
    ],
  },
  {
    id: "d2",
    num: 2,
    title: "Activités et secteurs",
    groups: [
      {
        questions: [
          {
            id: "D2_1",
            kind: "seuil",
            text: "Entreprise du bâtiment ou des travaux publics",
            seuilRM: "CA HT entre 400 et 1 000 k€",
            seuilRE: "CA HT supérieur à 1 000 k€",
          },
          {
            id: "D2_2",
            kind: "seuil",
            text: "Marchand de biens immobiliers",
            seuilRM: "Opérations entre 400 et 1 000 k€ HT",
            seuilRE: "Opérations supérieures à 1 000 k€ HT",
          },
          {
            id: "D2_3",
            kind: "seuil",
            text: "Promotion immobilière",
            seuilRM: "Opérations entre 400 et 1 000 k€ HT",
            seuilRE: "Opérations supérieures à 1 000 k€ HT",
          },
          {
            id: "D2_4",
            kind: "seuil",
            text: "Vente de véhicules d'occasion",
            seuilRM: "Marge de l'activité entre 25 et 50 % de la marge totale",
            seuilRE: "Marge de l'activité supérieure à 50 % de la marge totale",
          },
          {
            id: "D2_5",
            kind: "seuil",
            text: "Point de vente de la Française des jeux ou du PMU",
            seuilRM: "Commissions « jeux » inférieures à 75 k€ HT",
            seuilRE: "Commissions « jeux » supérieures à 75 k€ HT",
          },
          {
            id: "D2_6",
            kind: "seuil",
            text: "Buraliste (hors point de vente FDJ ou PMU)",
            seuilRM: "Commissions « tabac » inférieures à 75 k€ HT",
            seuilRE: "Commissions « tabac » supérieures à 75 k€ HT",
          },
          {
            id: "D2_7",
            kind: "seuil",
            text: "Casse automobile ou ferrailleur",
            seuilRM: "CA HT inférieur à 200 k€",
            seuilRE: "CA HT supérieur à 200 k€",
          },
          {
            id: "D2_8",
            kind: "seuil",
            text: "Établissement de nuit (discothèque, bar…)",
            seuilRM: "CA HT inférieur à 400 k€",
            seuilRE: "CA HT supérieur à 400 k€",
          },
          {
            id: "D2_9",
            kind: "seuil",
            text: "Restauration rapide hors chaînes nationales",
            seuilRM: "CA HT inférieur à 200 k€",
            seuilRE: "CA HT supérieur à 200 k€",
          },
          {
            id: "D2_10",
            kind: "seuil",
            text: "Hôtel, café, restaurant (hors établissements de nuit, restauration rapide, FDJ/PMU, buralistes)",
            seuilRM: "CA HT entre 400 et 1 000 k€",
            seuilRE: "CA HT supérieur à 1 000 k€",
          },
          {
            id: "D2_11",
            kind: "seuil",
            text: "Barber shop, nail bar (onglerie), salon de massage et tout commerce de cette nature",
            seuilRM: "CA HT inférieur à 200 k€",
            seuilRE: "CA HT supérieur à 200 k€",
          },
          {
            id: "D2_12",
            kind: "seuil",
            text: "Antiquaire, brocanteur ou galerie d'art",
            seuilRM: "CA HT inférieur à 200 k€",
            seuilRE: "CA HT supérieur à 200 k€",
          },
          {
            id: "D2_13",
            kind: "oui_non",
            text: "Commerce de jetons non fongibles (NFT : certificats numériques de propriété d'une œuvre, d'une image numérique ou d'un droit de propriété intellectuelle) ?",
          },
          {
            id: "D2_14",
            kind: "seuil",
            text: "Bijoutier ou commerce de métaux précieux ou de pierres précieuses",
            seuilRM: "CA HT entre 400 et 1 000 k€",
            seuilRE: "CA HT supérieur à 1 000 k€",
          },
          {
            id: "D2_15",
            kind: "seuil",
            text: "Commerce d'objets de luxe (montres, sacs…)",
            seuilRM: "CA HT entre 400 et 1 000 k€",
            seuilRE: "CA HT supérieur à 1 000 k€",
          },
          {
            id: "D2_16",
            kind: "oui_non",
            text: "Commerce et location de voiture de luxe ou de bateau ?",
          },
          {
            id: "D2_17",
            kind: "seuil",
            text: "Pharmacie",
            seuilRM: "CA HT entre 1 500 et 4 000 k€",
            seuilRE: "CA HT supérieur à 4 000 k€",
          },
          {
            id: "D2_18",
            kind: "seuil",
            text: "Autres commerces de proximité ou commerces de détail sur les marchés",
            seuilRM: "CA HT entre 400 et 1 000 k€",
            seuilRE: "CA HT supérieur à 1 000 k€",
          },
          {
            id: "D2_19",
            kind: "seuil",
            text: "Entreprise exerçant une activité de e-commerce vers l'étranger ou encaissant ses créances à l'étranger (activité autre que celles listées ci-dessus)",
            seuilRM: "CA HT inférieur à 200 k€",
            seuilRE: "CA HT supérieur à 200 k€",
          },
          { id: "D2_20", kind: "oui_non", text: "Changeur manuel ?" },
          {
            id: "D2_21",
            kind: "oui_non",
            text: "Prestataire de transmission de fonds en espèces de ou vers l'étranger (prestataire de services de paiement, pas un client effectuant des paiements pour son activité) ?",
          },
          {
            id: "D2_22",
            kind: "oui_non",
            text: "Prestations réalisées au profit ou sur des yachts ?",
          },
          {
            id: "D2_23",
            kind: "oui_non",
            text: "Entreprise participant à des transferts dans le sport professionnel ?",
          },
          {
            id: "D2_24",
            kind: "seuil",
            text: "Activité d'import/export ou de négoce international de matières premières",
            seuilRM: "CA HT inférieur à 1 000 k€",
            seuilRE: "CA HT supérieur à 1 000 k€",
          },
          {
            id: "D2_25",
            kind: "seuil",
            text: "Service aux entreprises : gardiennage, sécurité, nettoyage",
            seuilRM: "CA HT inférieur à 400 k€",
            seuilRE: "CA HT supérieur à 400 k€",
          },
          {
            id: "D2_26",
            kind: "oui_non",
            text: "Prestataire de services sur actifs numériques (plateforme crypto, service de conservation, échange…) sans agrément européen CASP/MiCA ?",
          },
          {
            id: "D2_27",
            kind: "oui_non",
            text: "Mixeur/mélangeur de cryptoactifs ?",
          },
          {
            id: "D2_28",
            kind: "oui_non",
            text: "Néo-banque (banque dont les services sont accessibles principalement en ligne) ?",
          },
        ],
      },
    ],
  },
  {
    id: "d3",
    num: 3,
    title: "Exposition aux risques / Localisation",
    groups: [
      {
        label:
          "Pays listés par le GAFI (Groupe d'action financière) ou à haut risque pour l'UE",
        lien: {
          href: "https://www.fatf-gafi.org/en/countries/black-and-grey-lists.html",
          texte: "Voir la liste officielle du GAFI",
        },
        questions: [
          {
            id: "D3_1_1",
            kind: "oui_non",
            text: "Client, représentant légal ou bénéficiaire effectif domicilié dans un des pays listés (GAFI / UE à haut risque) ?",
          },
          {
            id: "D3_1_2",
            kind: "oui_non",
            text: "Établissement, filiale ou société-mère du client localisé dans un des pays listés ?",
          },
          {
            id: "D3_1_3",
            kind: "oui_non",
            text: "Transferts de fonds depuis ou vers un des pays listés pour des montants annuels supérieurs à 50 k€ ?",
          },
        ],
      },
      {
        label: "Pays non coopératifs en matière fiscale",
        questions: [
          {
            id: "D3_2_1",
            kind: "oui_non",
            text: "Client, représentant légal ou bénéficiaire effectif domicilié dans un des pays listés (liste noire UE / France) ?",
          },
          {
            id: "D3_2_2",
            kind: "oui_non",
            text: "Établissement, filiale ou société-mère du client localisé dans un des pays listés ?",
          },
          {
            id: "D3_2_3",
            kind: "oui_non",
            text: "Transferts de fonds depuis ou vers un des pays listés pour des montants annuels supérieurs à 50 k€ ?",
          },
        ],
      },
      {
        label: "Sanctions financières ciblées",
        questions: [
          {
            id: "D3_3_1",
            kind: "oui_non",
            text: "Services rendus à des entités ou personnes physiques figurant sur la liste de gel des avoirs, hormis accord spécifique de la Direction Générale du Trésor ?",
          },
          {
            id: "D3_3_2",
            kind: "oui_non",
            text: "Missions de comptabilité, contrôle des comptes, conseil fiscal, conseil en gestion ou domiciliation exécutées depuis le 5 juillet 2022 au profit de personnes morales établies en Russie (ou leurs succursales en France), sauf détention par des entités UE ?",
          },
          {
            id: "D3_3_3",
            kind: "oui_non",
            text: "Transferts de fonds identifiés à destination/provenance d'une entité ou personne figurant sur la liste de gel des avoirs liée à la Russie/Biélorussie/Ukraine ?",
          },
          {
            id: "D3_3_4",
            kind: "oui_non",
            text: "Transferts de fonds identifiés à destination/provenance de Russie/Biélorussie/Ukraine ?",
          },
          {
            id: "D3_3_5",
            kind: "oui_non",
            text: "Transactions identifiées effectuées via une banque russe, biélorusse ou ukrainienne ?",
          },
          {
            id: "D3_3_6",
            kind: "oui_non",
            text: "Activité du client liée directement ou indirectement à la Russie, la Biélorussie ou l'Ukraine, figurant sur la liste des secteurs soumis à sanctions (Règlement UE 833/2014) ?",
          },
        ],
      },
      {
        label: "Outre-mer",
        questions: [
          {
            id: "D3_4",
            kind: "oui_non",
            text: "Le client a-t-il une activité économique significative dans un DROM ?",
          },
        ],
      },
    ],
  },
  {
    id: "d4",
    num: 4,
    title: "Nature de la mission",
    groups: [
      {
        questions: [
          {
            id: "D4_1",
            kind: "seuil",
            text: "Accompagnement à la création ou à la reprise d'entreprise, financée directement ou indirectement par un bénéficiaire effectif au moyen d'apports personnels de fonds",
            seuilRM: "Montant entre 30 et 100 k€",
            seuilRE: "Montant supérieur à 100 k€",
          },
          {
            id: "D4_2",
            kind: "seuil",
            text: "Accompagnement dans une prise de participation (autre que reprise d'entreprise) financée directement ou indirectement par un investisseur personne physique au moyen d'apports personnels de fonds",
            seuilRM: "Montant entre 100 et 250 k€",
            seuilRE: "Montant supérieur à 250 k€",
          },
          {
            id: "D4_3",
            kind: "seuil",
            text: "Accompagnement dans des opérations de restructurations juridiques et/ou financières nécessitant l'injection directe ou indirecte de fonds personnels par un investisseur personne physique, bénéficiaire effectif ou non",
            seuilRM: "Montant entre 100 et 250 k€",
            seuilRE: "Montant supérieur à 250 k€",
          },
          {
            id: "D4_4",
            kind: "oui_non",
            text: "Accompagnement d'une transmission universelle de patrimoine transnationale (autre que dans les cas susvisés) ?",
          },
          {
            id: "D4_5",
            kind: "oui_non",
            text: "Paiement des dettes fournisseurs ?",
          },
          {
            id: "D4_6",
            kind: "oui_non",
            text: "Recouvrement amiable des créances ?",
          },
          {
            id: "D4_7",
            kind: "seuil",
            text: "Comptes de campagne ayant donné lieu à un financement public",
            seuilRM: "Montant entre 5 et 20 k€",
            seuilRE: "Montant supérieur à 20 k€",
          },
          {
            id: "D4_8",
            kind: "pct",
            text: "Pourcentage des honoraires facturés au titre des missions de conseil ou montage fiscaux, de conseil en gestion de patrimoine et de conseil en recherche de financement ou de trésorerie",
          },
        ],
      },
    ],
  },
  {
    id: "d5",
    num: 5,
    title: "Opérations particulières",
    groups: [
      {
        questions: [
          {
            id: "D5_1",
            kind: "oui_non",
            text: "Prêts accordés par des non-associés n'ayant pas la qualité d'établissement financier, y compris les prêts familiaux ayant ou devant faire l'objet d'une déclaration n° 2062, d'un montant supérieur à 30 k€ ?",
          },
          {
            id: "D5_2",
            kind: "oui_non",
            text: "Financements obtenus à des conditions apparemment anormales ?",
          },
          {
            id: "D5_3",
            kind: "oui_non",
            text: "Société acquise ou créée domiciliée dans un pays hors UE sans justification économique ?",
          },
          {
            id: "D5_4",
            kind: "oui_non",
            text: "Financements pour des montants supérieurs à 100 k€ obtenus via des plateformes de financement participatif ?",
          },
          {
            id: "D5_5",
            kind: "oui_non",
            text: "Opérations en cryptoactifs pour un montant annuel supérieur à 50 k€ ?",
          },
          {
            id: "D5_6",
            kind: "oui_non",
            text: "Détention d'un portefeuille de cryptoactifs (wallet) auprès d'un prestataire de services sur actifs numériques (PSAN : plateforme d'achat, de vente ou de conservation de cryptoactifs, enregistrée auprès de l'AMF) ?",
          },
          {
            id: "D5_7",
            kind: "oui_non",
            text: "Acquisitions et cessions de jetons non fongibles (NFT) pour un montant annuel supérieur à 50 k€ ?",
          },
          {
            id: "D5_8",
            kind: "oui_non",
            text: "Cession de terres viticoles/châteaux/négociants en vins ou spiritueux à des sociétés ou ressortissants de pays où des fortunes importantes et récentes se sont constituées à la suite de changements de politique économique ?",
          },
        ],
      },
    ],
  },
];

export const ALL_QUESTIONS = MODULES.flatMap((m) =>
  m.groups.flatMap((g) => g.questions),
);

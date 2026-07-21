export interface SireneData {
  nom: string;
  siret: string;
  siren: string;
  adresse?: string;
  ville?: string;
  codePostal?: string;
  codeNaf?: string;
  secteurActivite?: string;
  formeJuridique?: string;
  representantLegal?: string;
  dateCreation?: string;
  estDrom?: boolean;
}

interface RechercheEntreprisesEtablissement {
  siret?: string;
  adresse?: string;
  numero_voie?: string;
  type_voie?: string;
  libelle_voie?: string;
  code_postal?: string;
  libelle_commune?: string;
  activite_principale?: string;
}

interface RechercheEntreprisesDirigeant {
  nom?: string;
  prenoms?: string;
  qualite?: string;
}

interface RechercheEntreprisesResult {
  siren: string;
  nom_complet?: string;
  nom_raison_sociale?: string;
  activite_principale?: string;
  section_activite_principale?: string;
  nature_juridique?: string;
  date_creation?: string;
  dirigeants?: RechercheEntreprisesDirigeant[];
  siege?: RechercheEntreprisesEtablissement;
  matching_etablissements?: RechercheEntreprisesEtablissement[];
}

// Nomenclature NAF Rév. 2 — 21 sections (lettres A à U), stable depuis 2008.
// Utilisée comme libellé de secteur lisible faute de traduction fiable du code NAF détaillé.
const SECTION_NAF_LABELS: Record<string, string> = {
  A: "Agriculture, sylviculture et pêche",
  B: "Industries extractives",
  C: "Industrie manufacturière",
  D: "Production et distribution d'électricité, de gaz, de vapeur et d'air conditionné",
  E: "Production et distribution d'eau, assainissement, gestion des déchets",
  F: "Construction",
  G: "Commerce, réparation d'automobiles et de motocycles",
  H: "Transports et entreposage",
  I: "Hébergement et restauration",
  J: "Information et communication",
  K: "Activités financières et d'assurance",
  L: "Activités immobilières",
  M: "Activités spécialisées, scientifiques et techniques",
  N: "Activités de services administratifs et de soutien",
  O: "Administration publique",
  P: "Enseignement",
  Q: "Santé humaine et action sociale",
  R: "Arts, spectacles et activités récréatives",
  S: "Autres activités de services",
  T: "Activités des ménages en tant qu'employeurs",
  U: "Activités extra-territoriales",
};

// Codes postaux des DROM (départements et régions d'outre-mer).
export const PREFIXES_DROM = ["971", "972", "973", "974", "976"];

export function isCodePostalDrom(codePostal?: string | null): boolean {
  return !!codePostal && PREFIXES_DROM.some((p) => codePostal.startsWith(p));
}

// API publique gratuite du gouvernement (recherche-entreprises.api.gouv.fr),
// sans authentification et accessible en CORS depuis le navigateur.
// L'API Sirene V3 de l'INSEE nécessite un token OAuth2 côté serveur, ce qui
// n'est pas praticable pour un appel direct depuis le front.
export async function fetchSirene(siretRaw: string): Promise<SireneData> {
  const siret = siretRaw.replace(/\s/g, "");
  if (siret.length !== 14) {
    throw new Error("Le SIRET doit contenir 14 chiffres");
  }

  let res: Response;
  try {
    res = await fetch(
      `https://recherche-entreprises.api.gouv.fr/search?q=${siret}`,
    );
  } catch {
    throw new Error("Service SIRENE indisponible, réessayez plus tard");
  }

  if (!res.ok) {
    throw new Error("Service SIRENE indisponible, réessayez plus tard");
  }

  const data = (await res.json()) as { results?: RechercheEntreprisesResult[] };
  const entreprise = data.results?.[0];
  if (!entreprise) {
    throw new Error("SIRET introuvable");
  }

  const etablissement: RechercheEntreprisesEtablissement | undefined =
    entreprise.matching_etablissements?.find((e) => e.siret === siret) ??
    entreprise.siege;

  const codePostal = etablissement?.code_postal;

  // Le siège expose numero_voie/type_voie/libelle_voie séparément, mais les entrées
  // de matching_etablissements (le cas le plus fréquent) n'exposent que la chaîne
  // "adresse" déjà formatée "{rue} {codePostal} {ville}" — on retire ce suffixe
  // pour n'en garder que la rue, puisque ville/codePostal sont déjà des champs séparés.
  const voieParts = [
    etablissement?.numero_voie,
    etablissement?.type_voie,
    etablissement?.libelle_voie,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  let adresse = voieParts;
  if (!adresse && etablissement?.adresse) {
    const suffixe = [codePostal, etablissement.libelle_commune]
      .filter(Boolean)
      .join(" ");
    adresse = suffixe
      ? etablissement.adresse
          .replace(new RegExp(`\\s*${suffixe}\\s*$`), "")
          .trim()
      : etablissement.adresse;
  }

  const dirigeant = entreprise.dirigeants?.[0];
  const representantLegal = dirigeant
    ? [dirigeant.prenoms, dirigeant.nom].filter(Boolean).join(" ").trim()
    : undefined;

  return {
    nom: entreprise.nom_complet ?? entreprise.nom_raison_sociale ?? "",
    siret,
    siren: entreprise.siren,
    adresse: adresse || undefined,
    ville: etablissement?.libelle_commune,
    codePostal,
    codeNaf:
      etablissement?.activite_principale ?? entreprise.activite_principale,
    // Code brut INSEE (ex: "5710"), non traduit en libellé faute de nomenclature
    // fiable vérifiable — modifiable librement par l'utilisateur dans le formulaire.
    secteurActivite: entreprise.section_activite_principale
      ? SECTION_NAF_LABELS[entreprise.section_activite_principale]
      : undefined,
    formeJuridique: entreprise.nature_juridique ?? undefined,
    representantLegal: representantLegal || undefined,
    // Date de création de l'entreprise (SIREN) — fiable et exacte, à l'inverse du
    // chiffre d'affaires et de l'effectif : l'API publique n'expose que des
    // tranches (catégorie d'entreprise, tranche d'effectif salarié), jamais de
    // valeur exacte. Pas d'auto-remplissage possible pour ces deux champs.
    dateCreation: entreprise.date_creation ?? undefined,
    estDrom: isCodePostalDrom(codePostal),
  };
}

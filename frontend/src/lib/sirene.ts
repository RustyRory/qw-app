export interface SireneData {
  nom: string;
  siret: string;
  siren: string;
  adresse?: string;
  ville?: string;
  codePostal?: string;
  codeNaf?: string;
  formeJuridique?: string;
  representantLegal?: string;
  estDrom?: boolean;
}

interface RechercheEntreprisesEtablissement {
  siret?: string;
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
  nature_juridique?: string;
  dirigeants?: RechercheEntreprisesDirigeant[];
  siege?: RechercheEntreprisesEtablissement;
  matching_etablissements?: RechercheEntreprisesEtablissement[];
}

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

  const adresse = [
    etablissement?.numero_voie,
    etablissement?.type_voie,
    etablissement?.libelle_voie,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  const dirigeant = entreprise.dirigeants?.[0];
  const representantLegal = dirigeant
    ? [dirigeant.prenoms, dirigeant.nom].filter(Boolean).join(" ").trim()
    : undefined;

  const codePostal = etablissement?.code_postal;

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
    formeJuridique: entreprise.nature_juridique ?? undefined,
    representantLegal: representantLegal || undefined,
    estDrom: isCodePostalDrom(codePostal),
  };
}

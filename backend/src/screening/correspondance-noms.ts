// Comparaison de noms avec le registre national des gels (DG Trésor).
// Volontairement large : tout nom proche est signalé « à vérifier » ; c'est
// l'humain qui tranche entre homonyme et correspondance réelle.

// Mots sans valeur distinctive : formes juridiques, articles…
const MOTS_IGNORES = new Set([
  'sas',
  'sasu',
  'sarl',
  'sarlu',
  'eurl',
  'sa',
  'sci',
  'snc',
  'scp',
  'scs',
  'sca',
  'selarl',
  'selas',
  'sel',
  'gie',
  'ste',
  'societe',
  'ltd',
  'llc',
  'jsc',
  'pjsc',
  'ojsc',
  'cjsc',
  'ooo',
  'oao',
  'zao',
  'pao',
  'ao',
  'gmbh',
  'ag',
  'inc',
  'corp',
  'co',
  'company',
  'limited',
  'llp',
  'plc',
  'bv',
  'nv',
  'the',
  'de',
  'du',
  'des',
  'la',
  'le',
  'les',
  'et',
  'and',
  'of',
  'el',
  'al',
]);

export function normaliser(texte: string): string {
  return texte
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function motsSignificatifs(texte: string): string[] {
  return normaliser(texte)
    .split(' ')
    .filter((m) => m.length > 1 && !MOTS_IGNORES.has(m));
}

export type NatureRegistre = 'PERSONNE_PHYSIQUE' | 'PERSONNE_MORALE';

export interface EntreeRegistre {
  id: number;
  nature: NatureRegistre;
  nom: string;
  motifs: string;
  // Variantes du nom (nom, prénom + nom, alias), déjà découpées en mots.
  variantes: string[][];
}

export type TypeRecherche = 'PERSONNE' | 'ENTITE';

// Une personne est retenue si tous les mots de son nom (au moins 2 : prénom
// et nom) figurent dans une variante d'une personne du registre, quel que
// soit l'ordre. Une entité est retenue si son nom coïncide avec une
// variante (ou l'inclut, à partir de 2 mots significatifs).
export function correspond(
  recherche: string,
  type: TypeRecherche,
  entree: EntreeRegistre,
): boolean {
  const q = motsSignificatifs(recherche);
  if (type === 'PERSONNE') {
    if (entree.nature !== 'PERSONNE_PHYSIQUE' || q.length < 2) return false;
    return entree.variantes.some((v) => q.every((m) => v.includes(m)));
  }
  if (entree.nature !== 'PERSONNE_MORALE' || q.length === 0) return false;
  return entree.variantes.some((v) => {
    if (v.length === 0) return false;
    const egal = v.length === q.length && q.every((m) => v.includes(m));
    if (egal) return true;
    if (q.length >= 2 && q.every((m) => v.includes(m))) return true;
    return v.length >= 2 && v.every((m) => q.includes(m));
  });
}

export function rechercher(
  recherche: string,
  type: TypeRecherche,
  registre: EntreeRegistre[],
): EntreeRegistre[] {
  return registre.filter((e) => correspond(recherche, type, e));
}

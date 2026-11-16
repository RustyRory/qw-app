import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { UPLOADS_ROOT } from '../common/storage';
import { EntreeRegistre, motsSignificatifs } from './correspondance-noms';

// Registre national des gels des avoirs (DG Trésor), publié chaque jour.
export const URL_REGISTRE_GELS =
  process.env.REGISTRE_GELS_URL ??
  'https://gels-avoirs.dgtresor.gouv.fr/ApiPublic/api/v1/publication/derniere-publication-fichier-json';

const CACHE = path.join(UPLOADS_ROOT, 'registre-gels.json');

interface RegistreBrut {
  Publications: {
    DatePublication: string;
    PublicationDetail: {
      IdRegistre: number;
      Nature: string;
      Nom: string;
      RegistreDetail: {
        TypeChamp: string;
        Valeur: Record<string, unknown>[];
      }[];
    }[];
  };
}

export interface Registre {
  publieLe: Date;
  entrees: EntreeRegistre[];
}

// Ne garde que ce qui sert à la comparaison : nature, nom, variantes
// (prénom + nom, alias), motifs résumés.
export function compacter(brut: RegistreBrut): Registre {
  const entrees: EntreeRegistre[] = [];
  for (const e of brut.Publications.PublicationDetail) {
    const nature =
      e.Nature === 'Personne physique'
        ? 'PERSONNE_PHYSIQUE'
        : e.Nature === 'Personne morale'
          ? 'PERSONNE_MORALE'
          : null;
    if (!nature) continue; // navires
    const champ = (type: string) =>
      e.RegistreDetail.filter((c) => c.TypeChamp === type).flatMap(
        (c) => c.Valeur,
      );
    const noms = new Set<string>([e.Nom]);
    for (const p of champ('PRENOM')) {
      if (typeof p.Prenom === 'string') noms.add(`${p.Prenom} ${e.Nom}`);
    }
    for (const a of champ('ALIAS')) {
      if (typeof a.Alias === 'string') noms.add(a.Alias);
    }
    const motifs = champ('MOTIFS')
      .map((m) => (typeof m.Motifs === 'string' ? m.Motifs : ''))
      .join(' ')
      .slice(0, 500);
    entrees.push({
      id: e.IdRegistre,
      nature,
      nom: e.Nom,
      motifs,
      variantes: [...noms].map(motsSignificatifs).filter((v) => v.length > 0),
    });
  }
  return { publieLe: new Date(brut.Publications.DatePublication), entrees };
}

@Injectable()
export class RegistreGelsService {
  private readonly logger = new Logger(RegistreGelsService.name);
  private registre: Registre | null = null;

  // Télécharge la dernière publication ; en cas d'échec, garde la
  // précédente (mémoire ou copie sur disque).
  async actualiser(): Promise<Registre | null> {
    try {
      const res = await fetch(URL_REGISTRE_GELS, {
        signal: AbortSignal.timeout(120_000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const registre = compacter((await res.json()) as RegistreBrut);
      if (registre.entrees.length === 0) throw new Error('registre vide');
      this.registre = registre;
      fs.mkdirSync(path.dirname(CACHE), { recursive: true });
      fs.writeFileSync(CACHE, JSON.stringify(registre));
      this.logger.log(
        `Registre des gels chargé : ${registre.entrees.length} entrées (publié le ${registre.publieLe.toISOString()})`,
      );
    } catch (err) {
      this.logger.error(
        `Téléchargement du registre des gels impossible : ${err instanceof Error ? err.message : String(err)}`,
      );
    }
    return this.obtenir();
  }

  obtenir(): Registre | null {
    if (this.registre) return this.registre;
    try {
      const cache = JSON.parse(fs.readFileSync(CACHE, 'utf8')) as Registre;
      this.registre = { ...cache, publieLe: new Date(cache.publieLe) };
      return this.registre;
    } catch {
      return null;
    }
  }

  // Registre du jour si possible (télécharge s'il date d'avant aujourd'hui).
  async obtenirAJour(): Promise<Registre | null> {
    const r = this.obtenir();
    const aujourdhui = new Date().toDateString();
    if (r && r.publieLe.toDateString() === aujourdhui) return r;
    return this.actualiser();
  }
}

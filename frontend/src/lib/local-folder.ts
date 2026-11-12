"use client";

// Dossier local de stockage des documents, choisi par l'utilisateur dans ses
// paramètres (API File System Access : Edge et Chrome uniquement).
//
// Le « handle » du dossier est mémorisé dans IndexedDB (par utilisateur) :
// c'est le seul stockage navigateur capable de le conserver d'une session à
// l'autre. Le navigateur peut redemander l'autorisation d'accès ; elle ne
// peut être accordée qu'à la suite d'un clic (d'où `demander` à true
// uniquement dans des gestionnaires d'événements).
//
// Arborescence gérée dans le dossier choisi :
//   Clients/<Réf> <Nom>/<Nom>-<Type>-<JJ-MM-AAAA>.<ext>
//   Prospects/<Réf> <Nom>/…

type EtatPermission = "granted" | "denied" | "prompt";

interface HandleAvecPermission extends FileSystemDirectoryHandle {
  queryPermission(opts: { mode: "readwrite" }): Promise<EtatPermission>;
  requestPermission(opts: { mode: "readwrite" }): Promise<EtatPermission>;
}

declare global {
  interface Window {
    showDirectoryPicker?: (opts?: {
      id?: string;
      mode?: "read" | "readwrite";
    }) => Promise<FileSystemDirectoryHandle>;
  }
}

export class DossierLocalError extends Error {}

const DB_NAME = "qw-app";
const STORE = "dossiers";

export function dossierLocalSupporte(): boolean {
  return typeof window !== "undefined" && !!window.showDirectoryPicker;
}

function ouvrirBase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function lireHandle(
  userId: string,
): Promise<HandleAvecPermission | null> {
  const db = await ouvrirBase();
  return new Promise((resolve, reject) => {
    const req = db
      .transaction(STORE, "readonly")
      .objectStore(STORE)
      .get(userId);
    req.onsuccess = () => resolve((req.result as HandleAvecPermission) ?? null);
    req.onerror = () => reject(req.error);
  });
}

async function ecrireHandle(
  userId: string,
  handle: FileSystemDirectoryHandle | null,
): Promise<void> {
  const db = await ouvrirBase();
  return new Promise((resolve, reject) => {
    const store = db.transaction(STORE, "readwrite").objectStore(STORE);
    const req = handle ? store.put(handle, userId) : store.delete(userId);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// Ouvre le sélecteur de dossier (à appeler depuis un clic), mémorise le
// dossier choisi et y crée les sous-dossiers Clients/ et Prospects/.
export async function choisirDossierLocal(userId: string): Promise<string> {
  if (!dossierLocalSupporte()) {
    throw new DossierLocalError(
      "Votre navigateur ne permet pas de choisir un dossier : utilisez Microsoft Edge ou Google Chrome.",
    );
  }
  const handle = await window.showDirectoryPicker!({
    id: "qw-app",
    mode: "readwrite",
  });
  await handle.getDirectoryHandle("Clients", { create: true });
  await handle.getDirectoryHandle("Prospects", { create: true });
  await ecrireHandle(userId, handle);
  return handle.name;
}

export async function oublierDossierLocal(userId: string): Promise<void> {
  await ecrireHandle(userId, null);
}

export interface EtatDossierLocal {
  nom: string | null;
  permission: EtatPermission | null;
}

export async function etatDossierLocal(
  userId: string,
): Promise<EtatDossierLocal> {
  if (!dossierLocalSupporte()) return { nom: null, permission: null };
  const handle = await lireHandle(userId);
  if (!handle) return { nom: null, permission: null };
  return {
    nom: handle.name,
    permission: await handle.queryPermission({ mode: "readwrite" }),
  };
}

// Renvoie le dossier si l'accès en écriture est (ou peut être) accordé.
// `demander` déclenche la demande d'autorisation du navigateur : à ne
// passer à true que pendant le traitement d'un clic.
export async function accederDossierLocal(
  userId: string,
  demander: boolean,
): Promise<FileSystemDirectoryHandle> {
  if (!dossierLocalSupporte()) {
    throw new DossierLocalError(
      "Le dépôt de documents nécessite Microsoft Edge ou Google Chrome (enregistrement dans votre dossier local).",
    );
  }
  const handle = await lireHandle(userId);
  if (!handle) {
    throw new DossierLocalError(
      "Aucun dossier de stockage choisi : définissez-le dans Mon profil › Dossier de stockage.",
    );
  }
  let permission = await handle.queryPermission({ mode: "readwrite" });
  if (permission === "prompt" && demander) {
    permission = await handle.requestPermission({ mode: "readwrite" });
  }
  if (permission !== "granted") {
    throw new DossierLocalError(
      `Accès au dossier « ${handle.name} » refusé : autorisez-le pour pouvoir déposer des documents.`,
    );
  }
  return handle;
}

function segments(cheminRelatif: string): string[] {
  return cheminRelatif.split("/").filter(Boolean);
}

async function sousDossier(
  racine: FileSystemDirectoryHandle,
  parties: string[],
  creer: boolean,
): Promise<FileSystemDirectoryHandle> {
  let courant = racine;
  for (const nom of parties) {
    courant = await courant.getDirectoryHandle(nom, { create: creer });
  }
  return courant;
}

export async function ecrireFichierLocal(
  racine: FileSystemDirectoryHandle,
  cheminRelatif: string,
  contenu: Blob,
): Promise<void> {
  const parties = segments(cheminRelatif);
  const nomFichier = parties.pop()!;
  const dossier = await sousDossier(racine, parties, true);
  const fichier = await dossier.getFileHandle(nomFichier, { create: true });
  const flux = await fichier.createWritable();
  await flux.write(contenu);
  await flux.close();
}

export async function fichierLocalExiste(
  racine: FileSystemDirectoryHandle,
  cheminRelatif: string,
): Promise<boolean> {
  const parties = segments(cheminRelatif);
  const nomFichier = parties.pop()!;
  try {
    const dossier = await sousDossier(racine, parties, false);
    await dossier.getFileHandle(nomFichier);
    return true;
  } catch {
    return false;
  }
}

// Déplace (copie puis supprime) un fichier du dossier local, en créant les
// sous-dossiers de destination. Sans effet si la source n'existe pas.
export async function deplacerFichierLocal(
  racine: FileSystemDirectoryHandle,
  source: string,
  destination: string,
): Promise<boolean> {
  if (source === destination) return true;
  const partiesSource = segments(source);
  const nomSource = partiesSource.pop()!;
  let dossierSource: FileSystemDirectoryHandle;
  let fichier: File;
  try {
    dossierSource = await sousDossier(racine, partiesSource, false);
    fichier = await (await dossierSource.getFileHandle(nomSource)).getFile();
  } catch {
    return false;
  }
  await ecrireFichierLocal(racine, destination, fichier);
  await dossierSource.removeEntry(nomSource);
  return true;
}

// Supprime un sous-dossier s'il est vide (après un déplacement).
export async function supprimerDossierSiVide(
  racine: FileSystemDirectoryHandle,
  cheminDossier: string,
): Promise<void> {
  const parties = segments(cheminDossier);
  const nom = parties.pop();
  if (!nom) return;
  try {
    const parent = await sousDossier(racine, parties, false);
    const dossier = await parent.getDirectoryHandle(nom);
    for await (const entree of (
      dossier as unknown as { keys(): AsyncIterable<string> }
    ).keys()) {
      void entree;
      return;
    }
    await parent.removeEntry(nom);
  } catch {
    // dossier absent : rien à faire
  }
}

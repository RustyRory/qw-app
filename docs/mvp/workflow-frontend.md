# Workflow Frontend — QW-App LCB-FT

> Guide complet des pages à développer, avec zoning de chaque écran.
> Stack : Next.js 16 (App Router), React 19, Tailwind v4, TypeScript.

---

## 1. État des lieux — ce qui existe

| Fichier | Statut |
|---------|--------|
| `/login/page.tsx` | ✅ Garde, adapter les types Role |
| `/dashboard/page.tsx` | ♻️ Réécrire les KPIs |
| `/dashboard/clients/page.tsx` | ♻️ Adapter aux nouveaux types |
| `/dashboard/clients/new/page.tsx` | ♻️ Réécrire le formulaire |
| `/dashboard/clients/[id]/page.tsx` | ♻️ Réécrire (onglets) |
| `/dashboard/prospects/page.tsx` | ♻️ Réécrire en Kanban |
| `/dashboard/prospects/new/page.tsx` | ♻️ Adapter formulaire |
| `/dashboard/prospects/[id]/page.tsx` | ♻️ Réécrire |
| `/dashboard/scoring/page.tsx` | ♻️ Réécrire ARPEC |
| `/dashboard/admin/page.tsx` | ♻️ Réécrire gestion users |
| `AppSidebar.tsx` | ♻️ Ajouter les nouveaux liens |
| `types/index.ts` | ♻️ Réécrire tous les types |

---

## 2. Arborescence complète des routes

```
/login

/dashboard
├── /                              ← Accueil — KPIs globaux
├── /prospects                     ← Pipeline Kanban
│   ├── /new                       ← Formulaire nouveau prospect
│   └── /[id]                      ← Fiche prospect
│       └── /questionnaire         ← Questionnaire d'acceptation
├── /clients                       ← Liste des clients
│   ├── /new                       ← Formulaire nouveau client
│   └── /[id]                      ← Fiche client (onglets)
│       ├── /               tab=infos     — Identité + KYC
│       ├── ?tab=kyc               tab=kyc      — Checklist KYC + documents
│       ├── ?tab=beneficiaires     tab=be       — Bénéficiaires effectifs (UBO)
│       ├── ?tab=contacts          tab=contacts — Contacts tiers
│       ├── ?tab=scoring           tab=scoring  — Évaluation ARPEC
│       ├── ?tab=missions          tab=missions — Missions + lettres de mission
│       ├── ?tab=planning          tab=planning — Planning / diligences
│       ├── ?tab=obligations       tab=obligations — Tableau d'obligations
│       └── ?tab=operations        tab=operations  — Opérations sensibles
├── /cartographie                  ← Cartographie globale des risques
├── /obligations                   ← Tableau global des obligations
├── /operations-sensibles          ← Vue globale opérations sensibles
├── /planning                      ← Planning global cabinet
└── /admin
    ├── /                          ← Accueil admin
    └── /users
        ├── /new                   ← Créer un utilisateur
        └── /[id]                  ← Éditer un utilisateur
```

---

## 3. Mise à jour des types TypeScript

**Fichier à réécrire** : `src/types/index.ts`

```typescript
// ─── Enums ───────────────────────────────────────────────────────────────────

export type Role = 'COLLABORATEUR' | 'RESPONSABLE' | 'EXPERT_COMPTABLE' | 'ADMIN';
export type TypeEntite = 'PERSONNE_PHYSIQUE' | 'PERSONNE_MORALE';
export type StatutKanban = 'PRISE_CONTACT' | 'DECOUVERTE' | 'OPPORTUNITE' | 'LAB' | 'PREPARATION' | 'CONVERTI' | 'REFUSE';
export type StatutClient = 'ACTIF' | 'INACTIF' | 'RESILIE';
export type StatutKyc = 'INCOMPLET' | 'COMPLET' | 'VALIDE' | 'EXPIRE';
export type ScreeningStatut = 'NON_EFFECTUE' | 'OK' | 'ALERTE';
export type NiveauRisque = 'FAIBLE' | 'MOYEN' | 'ELEVE';
export type TypeDocument = 'PIECE_IDENTITE' | 'JUSTIFICATIF_DOMICILE' | 'KBIS' | 'STATUTS' | 'LISTE_UBO' | 'ATTESTATION_PPE' | 'JUSTIFICATIF_FONDS' | 'LETTRE_MISSION' | 'RAPPORT' | 'ANNEXE' | 'AUTRE';
export type TypeMission = 'COMPTABILITE' | 'AUDIT' | 'CONSEIL' | 'JURIDIQUE' | 'AUTRE';
export type StatutMission = 'EN_COURS' | 'SUSPENDUE' | 'TERMINEE' | 'RESILIEE';
export type TypeObligation = 'KYC_VERIFICATION' | 'EVALUATION_RISQUE' | 'MISE_A_JOUR_DOCS' | 'VALIDATION_RELATION' | 'LETTRE_MISSION';
export type StatutObligation = 'A_FAIRE' | 'FAIT' | 'EN_RETARD' | 'EXPIRE';
export type TypeOperationSensible = 'SANS_JUSTIFICATION' | 'COMPLEXE' | 'SANS_OBJET_LICITE' | 'INHABITUELLE' | 'ECONOMIE_VIRTUELLE' | 'ESPECES' | 'AUTRE';
export type StatutOperationSensible = 'SIGNALEE' | 'EN_ANALYSE' | 'CLASSEE' | 'TRACFIN_DECLARE';
export type TypeContact = 'INTERVENANT' | 'AVOCAT' | 'COMMISSAIRE_COMPTES' | 'NOTAIRE' | 'AUTRE';
export type StatutQuestionnaire = 'EN_COURS' | 'VALIDE' | 'REFUSE';

// ─── Entités ──────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  prenom: string;
  nom: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
}

export interface Prospect {
  id: string;
  ref: string;
  siret?: string | null;
  nom: string;
  email?: string | null;
  telephone?: string | null;
  typeEntite: TypeEntite;
  statutKanban: StatutKanban;
  motifRefus?: string | null;
  activite?: string | null;
  codeNaf?: string | null;
  adresse?: string | null;
  ville?: string | null;
  codePostal?: string | null;
  pays: string;
  chiffreAffaires?: number | null;
  effectif?: number | null;
  notes?: string | null;
  createdBy?: User;
  assignedTo?: User | null;
  questionnaire?: QuestionnaireAcceptation | null;
  client?: Client | null;
  createdAt: string;
  updatedAt: string;
}

export interface QuestionnaireAcceptation {
  id: string;
  prospect: Prospect;
  statut: StatutQuestionnaire;
  reponses?: Record<string, unknown> | null;
  motifRefus?: string | null;
  validatedAt?: string | null;
  validatedBy?: User | null;
  createdBy: User;
  createdAt: string;
}

export interface Client {
  id: string;
  ref: string;
  siret?: string | null;
  siren?: string | null;
  raisonSociale: string;
  typeEntite: TypeEntite;
  formeJuridique?: string | null;
  codeNaf?: string | null;
  activitePrincipale?: string | null;
  dateCreationEntreprise?: string | null;
  adresseSiege?: string | null;
  ville?: string | null;
  codePostal?: string | null;
  pays: string;
  chiffreAffaires?: number | null;
  effectif?: number | null;
  natureMission?: string | null;
  statut: StatutClient;
  // KYC fusionné
  kycStatut: StatutKyc;
  ppe: boolean;
  ppeDetail?: string | null;
  uboSaisi: boolean;
  screeningStatut: ScreeningStatut;
  screeningDate?: string | null;
  kycCompletedAt?: string | null;
  kycValidatedBy?: User | null;
  createdBy?: User;
  createdAt: string;
  updatedAt: string;
}

export interface BeneficiaireEffectif {
  id: string;
  prenom?: string | null;
  nom: string;
  dateNaissance?: string | null;
  nationalite?: string | null;
  adresse?: string | null;
  pourcentageDetention: number;
  ppe: boolean;
  createdAt: string;
}

export interface Contact {
  id: string;
  prenom?: string | null;
  nom: string;
  email?: string | null;
  telephone?: string | null;
  type: TypeContact;
  roleDetail?: string | null;
  createdAt: string;
}

export interface Document {
  id: string;
  type: TypeDocument;
  nom: string;
  mimeType: string;
  tailleOctets: number;
  s3Key: string;
  expiresAt?: string | null;
  createdAt: string;
}

export interface ScoreRisque {
  id: string;
  score: number;
  niveau: NiveauRisque;
  reponses: {
    clientCaracteristiques: number;
    activiteSecteur: number;
    zoneGeographique: number;
    typeMission: number;
  };
  calculatedBy?: User;
  createdAt: string;
}

export interface Mission {
  id: string;
  type: TypeMission;
  description?: string | null;
  statut: StatutMission;
  dateDebut: string;
  dateFin?: string | null;
  honoraires?: number | null;
  createdBy?: User;
  lettresMission?: LettreMission[];
  createdAt: string;
  updatedAt: string;
}

export interface LettreMission {
  id: string;
  version: number;
  contenu: Record<string, unknown>;
  signeeParExpert: boolean;
  signeeAt?: string | null;
  signataire?: User | null;
  s3Key?: string | null;
  createdAt: string;
}

export interface PlanningEtape {
  id: string;
  titre: string;
  description?: string | null;
  type: 'REGLEMENTAIRE' | 'MANUELLE';
  statut: 'A_FAIRE' | 'EN_COURS' | 'FAIT' | 'ANNULEE';
  dateEcheance?: string | null;
  completedAt?: string | null;
  completedBy?: User | null;
  assignedTo?: User | null;
  createdAt: string;
}

export interface Obligation {
  id: string;
  type: TypeObligation;
  statut: StatutObligation;
  dateEcheance?: string | null;
  completedAt?: string | null;
  createdAt: string;
}

export interface OperationSensible {
  id: string;
  type: TypeOperationSensible;
  description: string;
  montant?: number | null;
  devise?: string | null;
  statut: StatutOperationSensible;
  tracfinDate?: string | null;
  validatedBy?: User | null;
  validatedAt?: string | null;
  signaleBy: User;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  action: string;
  ressource: string;
  ressourceId: string;
  utilisateur?: User;
  details?: Record<string, unknown> | null;
  ipAddress?: string | null;
  createdAt: string;
}
```

---

## 4. Navigation — mise à jour de la sidebar

**Fichier** : `src/components/layout/AppSidebar.tsx`

Nouveaux liens à ajouter :

```
─── Principal ─────────────────────
  Tableau de bord           /dashboard
  Prospects (Kanban)        /dashboard/prospects
  Clients                   /dashboard/clients

─── Conformité ────────────────────
  Cartographie des risques  /dashboard/cartographie
  Obligations               /dashboard/obligations
  Opérations sensibles      /dashboard/operations-sensibles
  Planning                  /dashboard/planning

─── Administration ─────────────────  (ADMIN only)
  Utilisateurs              /dashboard/admin/users
```

---

## 5. Pages à développer — zonings

---

### PAGE 1 — `/dashboard` — Tableau de bord

**Objectif** : Vue synthétique de l'état de conformité du cabinet.
**Accès** : Tous les rôles.

```
┌─────────────────────────────────────────────────────────────┐
│  HEADER  "Tableau de bord"                    [Nom + rôle]  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ Prospects │  │ Clients  │  │ Risque   │  │Obligations│  │
│  │  actifs   │  │ actifs   │  │  Élevé   │  │ en retard │  │
│  │    12     │  │   47     │  │    3     │  │    5      │  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│                                                             │
│  ┌─────────────────────────────┐  ┌────────────────────┐   │
│  │  CLIENTS À RISQUE ÉLEVÉ     │  │  OBLIGATIONS       │   │
│  │  (liste 5 derniers)         │  │  EN RETARD         │   │
│  │  ─────────────────          │  │  (liste 5 items)   │   │
│  │  [Client] [Niveau] [Score]  │  │  [Client] [Type]   │   │
│  │  ...                        │  │  [Échéance]        │   │
│  │  [Voir cartographie →]      │  │  [Voir tout →]     │   │
│  └─────────────────────────────┘  └────────────────────┘   │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  PROSPECTS EN PIPELINE                               │   │
│  │  Prise contact (3)  Découverte (2)  ...  LAB (1)    │   │
│  │  [Voir Kanban →]                                     │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  ACTIVITÉ RÉCENTE (audit trail — 10 derniers logs)   │   │
│  │  [User] a [action] [ressource] — [il y a X min]     │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

**Données nécessaires** :
- `GET /api/clients` → compter par statut
- `GET /api/scoring/client/:id/courant` → filtrer niveau ELEVE
- `GET /api/obligations?statut=EN_RETARD` → compter + lister
- `GET /api/prospects` → compter par statutKanban
- `GET /api/audit` → 10 derniers logs

---

### PAGE 2 — `/dashboard/prospects` — Pipeline Kanban

**Objectif** : Gérer le pipeline d'entrée en relation via un board Kanban drag-and-drop.
**Accès** : Tous les rôles.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  HEADER  "Prospects"                  [Filtres: assigné à moi] [+ Nouveau]  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  [PRISE       ] [DÉCOUVERTE ] [OPPORTUNITÉ] [LAB        ] [PRÉPARATION]    │
│  [CONTACT     ] [           ] [           ] [à effectuer] [client     ]    │
│  ─────────────   ───────────   ───────────   ───────────   ─────────────   │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌──────────┐  ┌───────────┐ │
│  │ SARL Dupont│ │ SCI Martin│  │ EURL Simon│  │ SAS Duval│  │ SA Moreau │ │
│  │ ref: QWP.. │ │ ref: QWP..│  │ ref: QWP..│  │ref: QWP..|  │ ref: QWP. │ │
│  │ Secteur:.. │ │ Secteur:..│  │ Secteur:..│  │ Secteur:.│  │ Secteur:. │ │
│  │ [J. Dupont]│ │ [M. Weber]│  │ [J. Dupont│  │[M. Weber]│  │[J. Dupont]│ │
│  │ il y a 2j  │ │ il y a 5j │  │ il y a 1j │  │il y a 3j │  │il y a 1s  │ │
│  └───────────┘  └───────────┘  └───────────┘  └──────────┘  └───────────┘ │
│  ┌───────────┐                                                              │
│  │ SAS Leroy │                                                              │
│  │ ref: QWP..│                                                              │
│  │ [+ Ajouter]│                                                             │
│  └───────────┘                                                              │
│                                                             [CONVERTI ✓]   │
│                                                             [REFUSÉ  ✗]    │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Comportement** :
- Drag-and-drop d'une colonne à l'autre → `PATCH /api/prospects/:id` (statutKanban)
- Clic sur une carte → navigation vers `/dashboard/prospects/[id]`
- Bouton "+ Nouveau" → `/dashboard/prospects/new`
- Colonnes CONVERTI et REFUSE en lecture seule (archivées à droite hors board)
- Filtre "Assigné à moi" visible pour Collaborateur seulement

**Données** : `GET /api/prospects` (tous les prospects non-convertis non-refusés)

---

### PAGE 3 — `/dashboard/prospects/new` — Nouveau prospect

**Objectif** : Créer un prospect avec pré-remplissage SIRENE via SIRET.
**Accès** : Tous les rôles.

```
┌───────────────────────────────────────────────────────────┐
│  ← Retour    "Nouveau prospect"                           │
├───────────────────────────────────────────────────────────┤
│                                                           │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  SIRET (14 chiffres)              [Rechercher SIRENE]│  │
│  │  [   14 chiffres   ]                                │  │
│  │                                                     │  │
│  │  ↓ données auto-remplies si SIRET valide            │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                           │
│  ┌──────────────────────────────────────────────────────┐ │
│  │  IDENTITÉ                                            │ │
│  │  Raison sociale / Nom *    [____________________]   │ │
│  │  Type d'entité *           ○ Personne morale         │ │
│  │                            ○ Personne physique       │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                           │
│  ┌──────────────────────────────────────────────────────┐ │
│  │  CONTACT                                             │ │
│  │  Email           [____________________]              │ │
│  │  Téléphone       [____________________]              │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                           │
│  ┌──────────────────────────────────────────────────────┐ │
│  │  ACTIVITÉ                                            │ │
│  │  Secteur / activité [____________________]           │ │
│  │  Code NAF           [______]                         │ │
│  │  CA estimé (€)      [____________________]           │ │
│  │  Effectif           [____________________]           │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                           │
│  ┌──────────────────────────────────────────────────────┐ │
│  │  LOCALISATION                                        │ │
│  │  Adresse        [____________________]               │ │
│  │  Ville          [____________________]               │ │
│  │  Code postal    [______]                             │ │
│  │  Pays           [France▼]                            │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                           │
│  ┌──────────────────────────────────────────────────────┐ │
│  │  NOTES INTERNES                                      │ │
│  │  [zone de texte libre                              ] │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                           │
│  [Annuler]                           [Créer le prospect]  │
└───────────────────────────────────────────────────────────┘
```

**Données** : `POST /api/prospects`
**API SIRENE** : appel externe sur saisie du SIRET (à implémenter côté Next.js route handler)

---

### PAGE 4 — `/dashboard/prospects/[id]` — Fiche prospect

**Objectif** : Vue détaillée d'un prospect avec accès au questionnaire d'acceptation et conversion.
**Accès** : Tous les rôles (actions de validation : RESPONSABLE, EXPERT_COMPTABLE).

```
┌─────────────────────────────────────────────────────────────────────────┐
│  ← Retour    "SARL Dupont & Associés"   [réf: QWP-2026-001]  [Éditer]  │
│                                         [Statut Kanban : DÉCOUVERTE ▼]  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────────────────────────┐  ┌──────────────────────────────────┐ │
│  │  IDENTITÉ                    │  │  PIPELINE                        │ │
│  │  Type : Personne morale      │  │  ● Prise de contact  ✓           │ │
│  │  SIRET : 123 456 789 00012   │  │  ● Découverte        ← (actuel)  │ │
│  │  Code NAF : 6920Z            │  │  ○ Opportunité                   │ │
│  │  Création : 12/03/2018       │  │  ○ LAB à effectuer               │ │
│  │  Adresse : 12 rue du Marché  │  │  ○ Préparation client            │ │
│  │           75001 Paris        │  │                                   │ │
│  │  CA estimé : 250 000 €       │  │  Assigné à : Jean Dupont         │ │
│  │  Effectif : 8                │  │  [Changer d'assigné]             │ │
│  └──────────────────────────────┘  └──────────────────────────────────┘ │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │  QUESTIONNAIRE D'ACCEPTATION                                        │ │
│  │  ─────────────────────────────────────────────────────────         │ │
│  │  Statut : ● EN COURS                                                │ │
│  │                                                                     │ │
│  │  [Ouvrir le questionnaire]          (RESPONSABLE/EXPERT seulement) │ │
│  │  [Valider ✓]   [Refuser ✗]                                          │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │  NOTES INTERNES                                                     │ │
│  │  [zone texte éditable]                                              │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│  ─── Actions ────────────────────────────────────────────────────────  │
│  [Supprimer]   [Refuser le prospect]   [Convertir en client →] (RESP.)  │
└─────────────────────────────────────────────────────────────────────────┘
```

**Données** :
- `GET /api/prospects/:id`
- `GET /api/questionnaires/prospect/:id`
- `PATCH /api/prospects/:id` (statut Kanban)
- `POST /api/prospects/:id/convertir` → crée le client
- `PATCH /api/questionnaires/:id/valider` / `refuser`

---

### PAGE 5 — `/dashboard/prospects/[id]/questionnaire` — Questionnaire d'acceptation

**Objectif** : Formulaire structuré de décision d'entrée en relation (LAB — Lettre d'Acceptation de la mission de Blanchiment).
**Accès** : COLLABORATEUR (saisie), RESPONSABLE + EXPERT_COMPTABLE (validation/refus).
**Base réglementaire** : Art. L.561-5 CMF, NPLAB, ARPEC, directives AMLD5/6.

**Structure UI** : 10 sections accordéon repliables + barre de progression en haut. Si le questionnaire est VALIDÉ ou REFUSÉ → lecture seule avec mention du validateur et de la date.

```
┌──────────────────────────────────────────────────────────────────────┐
│  ← Retour fiche prospect     "Questionnaire d'acceptation (LAB)"     │
│  SARL Dupont — réf: QWP-2026-001               Statut : ● EN COURS   │
├──────────────────────────────────────────────────────────────────────┤
│  Progression : ████████████░░░░░░░░  6 / 10 sections complétées      │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ▼ SECTION 1 — Identification et KYC            ✅ Complète          │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │  Personne morale                                               │  │
│  │  Q1  Le Kbis date-t-il de moins de 3 mois ?      ○ Oui ○ Non │  │
│  │  Q2  Les statuts constitutifs ont-ils été collectés ? ○ Oui ○ Non│
│  │  Q3  Le représentant légal a-t-il été identifié ?  ○ Oui ○ Non│  │
│  │  Q4  A-t-il le pouvoir d'engager la société       ○ Oui ○ Non │  │
│  │      (délégation vérifiée) ?                                   │  │
│  │                                                                │  │
│  │  Personne physique (si applicable)                             │  │
│  │  Q5  La pièce d'identité est-elle en cours de validité ? ○ Oui ○ Non│
│  │  Q6  Un justificatif de domicile < 3 mois a-t-il   ○ Oui ○ Non│  │
│  │      été collecté ?                                            │  │
│  │  Q7  L'adresse déclarée correspond-elle à la réalité ? ○ Oui ○ Non│
│  │                                                                │  │
│  │  Bénéficiaires effectifs                                       │  │
│  │  Q8  Tous les BE détenant >25% ont-ils été identifiés ? ○ Oui ○ Non│
│  │  Q9  Leur pièce d'identité a-t-elle été collectée ?   ○ Oui ○ Non│
│  │  Q10 Le Registre des BE (RBE) a-t-il été consulté ?  ○ Oui ○ Non│
│  │  Q11 Les données RBE sont-elles cohérentes avec       ○ Oui ○ Non│
│  │      les déclarations du client ?                              │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  ▼ SECTION 2 — Screening / Sanctions            ✅ Complète          │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │  Q12 Vérifié contre gel des avoirs (Direction du Trésor) ?   │  │
│  │       ○ Oui — résultat négatif  ○ Oui — alerte détectée  ○ Non│ │
│  │  Q13 Vérifié contre listes de sanctions européennes ?         │  │
│  │       ○ Oui — résultat négatif  ○ Oui — alerte détectée  ○ Non│ │
│  │  Q14 Vérifié contre liste OFAC (USA) et liste ONU ?           │  │
│  │       ○ Oui — résultat négatif  ○ Oui — alerte détectée  ○ Non│ │
│  │  Q15 Les bénéficiaires effectifs ont-ils aussi été screenés ? │  │
│  │       ○ Oui — résultat négatif  ○ Oui — alerte détectée  ○ Non│ │
│  │  Q16 Le résultat global du screening est-il négatif ?  ○ Oui ○ Non│
│  └────────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  ▼ SECTION 3 — PPE (Personne Politiquement Exposée)  ⚠️ À compléter  │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │  Q17 Le client exerce-t-il ou a-t-il exercé des fonctions     │  │
│  │      publiques importantes ?                          ○ Oui ○ Non│ │
│  │  Q18 Un membre de sa famille proche est-il une PPE ? ○ Oui ○ Non│ │
│  │  Q19 Un associé ou collaborateur proche est-il PPE ? ○ Oui ○ Non│ │
│  │                                                                │  │
│  │  Si PPE identifiée (Q17/Q18/Q19 = Oui) :                      │  │
│  │  Q20 Une autorisation hiérarchique a-t-elle été obtenue ?      │  │
│  │                                               ○ Oui ○ Non ○ N/A│ │
│  │  Q21 La source du patrimoine a-t-elle été documentée ?         │  │
│  │                                               ○ Oui ○ Non ○ N/A│ │
│  │  Q22 La source des fonds affectés à la mission est-elle        │  │
│  │      vérifiée ?                               ○ Oui ○ Non ○ N/A│ │
│  └────────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  ▶ SECTION 4 — Structure et propriété           ○ Non complétée      │
│  ▶ SECTION 5 — Zone géographique                ○ Non complétée      │
│  ▶ SECTION 6 — Activité et secteur              ○ Non complétée      │
│  ▶ SECTION 7 — Situation financière             ○ Non complétée      │
│  ▶ SECTION 8 — Antécédents                      ○ Non complétée      │
│  ▶ SECTION 9 — Mission et relation              ○ Non complétée      │
│  ▶ SECTION 10 — Décision finale                 🔒 (sections 1-9 req.)│
│                                                                      │
│  [Enregistrer le brouillon]       [Refuser ✗]       [Valider ✓]      │
│                           (RESPONSABLE / EXPERT_COMPTABLE seulement) │
└──────────────────────────────────────────────────────────────────────┘
```

---

**Liste complète des questions par section**

**Section 1 — Identification et KYC** (art. L.561-5 CMF)
- Q1 — Le Kbis date-t-il de moins de 3 mois ? *(PM)*
- Q2 — Les statuts constitutifs ont-ils été collectés ? *(PM)*
- Q3 — Le représentant légal a-t-il été identifié ?
- Q4 — A-t-il le pouvoir d'engager la société (délégation vérifiée) ?
- Q5 — La pièce d'identité est-elle en cours de validité ? *(PP)*
- Q6 — Un justificatif de domicile de moins de 3 mois a-t-il été collecté ? *(PP)*
- Q7 — L'adresse déclarée correspond-elle à la réalité ?
- Q8 — Tous les bénéficiaires effectifs détenant >25% ont-ils été identifiés ?
- Q9 — Leur pièce d'identité a-t-elle été collectée ?
- Q10 — Le Registre des Bénéficiaires Effectifs (RBE) a-t-il été consulté ?
- Q11 — Les données RBE sont-elles cohérentes avec les déclarations du client ?

> *(PM = Personne morale uniquement, PP = Personne physique uniquement)*

**Section 2 — Screening / Sanctions**
- Q12 — Vérifié contre la liste de gel des avoirs (Direction du Trésor) ?
- Q13 — Vérifié contre les listes de sanctions européennes ?
- Q14 — Vérifié contre la liste OFAC (USA) et la liste ONU ?
- Q15 — Les bénéficiaires effectifs ont-ils également été screenés ?
- Q16 — Le résultat global du screening est-il négatif (aucune correspondance) ?

**Section 3 — PPE**
- Q17 — Le client exerce-t-il ou a-t-il exercé des fonctions publiques importantes (nationales ou étrangères) ?
- Q18 — Un membre de sa famille proche est-il une PPE ?
- Q19 — Un associé ou collaborateur proche est-il une PPE ?
- Q20 — Si PPE : une autorisation hiérarchique a-t-elle été obtenue avant d'aller plus loin ?
- Q21 — Si PPE : la source du patrimoine a-t-elle été expliquée et documentée ?
- Q22 — Si PPE : la source des fonds affectés à la mission est-elle vérifiée ?

**Section 4 — Structure et propriété**
- Q23 — La chaîne de détention est-elle simple et transparente (moins de 3 niveaux de holding) ?
- Q24 — Existe-t-il des filiales ou participations dans des pays à risque ou paradis fiscaux ?
- Q25 — Des actions au porteur, trusts ou structures fiduciaires sont-ils impliqués ?
- Q26 — Des entités anonymes (fondations, fonds) figurent-elles dans la chaîne de propriété ?
- Q27 — Le capital est-il détenu en totalité ou en partie dans des pays non coopératifs ?

**Section 5 — Zone géographique**
- Q28 — Le siège social est-il situé en France ou dans un pays de l'UE ?
- Q29 — Les activités sont-elles exercées principalement en France ?
- Q30 — Le client a-t-il des filiales, succursales ou partenaires dans des pays listés par le GAFI ?
- Q31 — Le client effectue-t-il des transactions avec des pays sous embargo européen ou ONU ?
- Q32 — Des flux financiers importants sont-ils dirigés vers ou reçus de pays à risque ?
- Q33 — Le client opère-t-il dans des zones géographiques à forte criminalité financière ?

**Section 6 — Activité et secteur**
- Q34 — L'activité principale est-elle cohérente avec le code NAF/APE déclaré ?
- Q35 — Le secteur est-il sensible (crypto/NFT, jeux/casino, immobilier, art, armement, métaux précieux, change, forex) ?
- Q36 — Le chiffre d'affaires déclaré est-il cohérent avec l'effectif et la nature de l'activité ?
- Q37 — L'entreprise pratique-t-elle des transactions en espèces (>1 000 €) ?
- Q38 — Des paiements proviennent-ils de tiers non identifiés ou de comptes tiers ?
- Q39 — Le client a-t-il des clients ou fournisseurs principaux dans des pays à risque ?
- Q40 — L'activité génère-t-elle des flux transfrontaliers importants sans justification économique claire ?
- Q41 — L'activité présente-t-elle des variations de CA difficiles à expliquer ?

**Section 7 — Situation financière**
- Q42 — La santé financière est-elle compatible avec les honoraires envisagés ?
- Q43 — Des procédures collectives (redressement, liquidation) sont-elles en cours ?
- Q44 — Des dettes fiscales ou sociales significatives et non contestées sont-elles connues ?
- Q45 — Le client présente-t-il des signes de difficultés financières anormales au regard de son activité ?

**Section 8 — Antécédents**
- Q46 — Le client a-t-il fait l'objet de procédures pénales (fraude, blanchiment, corruption, ABS) ?
- Q47 — Des contentieux fiscaux ou douaniers sont-ils en cours ou récents (<5 ans) ?
- Q48 — Le client a-t-il été refusé ou résilié par un précédent cabinet d'expertise comptable ?
- Q49 — Des articles de presse négatifs, enquêtes journalistiques ou signalements le concernent-ils ?
- Q50 — Le client figure-t-il dans des bases de données de réputation négative (adverse media) ?

**Section 9 — Mission et relation**
- Q51 — La nature et le périmètre de la mission sont-ils clairement définis ?
- Q52 — La mission est-elle dans le périmètre habituel et les compétences du cabinet ?
- Q53 — Y a-t-il une urgence inhabituelle ou une pression temporelle anormale dans la demande ?
- Q54 — Le client a-t-il manifesté des réticences à fournir les documents demandés ?
- Q55 — Le client a-t-il posé des questions inhabituelles sur la confidentialité ou le secret professionnel ?
- Q56 — Le client cherche-t-il à limiter le périmètre de la mission pour éviter certains contrôles ?
- Q57 — Les informations fournies sont-elles cohérentes entre elles (pas de contradictions) ?
- Q58 — Le mode de règlement des honoraires est-il exclusivement par virement bancaire identifié ?
- Q59 — Les honoraires sont-ils cohérents avec la mission et la taille de l'entreprise ?
- Q60 — Y a-t-il un conflit d'intérêts potentiel avec un autre client ou dossier du cabinet ?
- Q61 — Le client comprend-il et accepte-t-il les obligations LCB-FT qui s'appliquent à la relation ?

**Section 10 — Décision finale** *(débloquée après sections 1–9)*
- Des éléments bloquants irréductibles ont-ils été identifiés ? (Oui/Non + détail libre)
- Niveau de diligences requis : Standard / Renforcées / Renforcées + validation hiérarchique
- Des diligences complémentaires sont-elles nécessaires avant de statuer ? (Oui/Non)
- Commentaire libre du responsable (textarea)
- **Décision : Accepter / Refuser / Mettre en attente**
- Si refus : motif obligatoire (conservé 5 ans — art. L.561-12 CMF)
- Si risque ÉLEVÉ : contresignature de l'expert-comptable requise (US-A03)

---

**Stockage** : toutes les réponses sont sérialisées en JSONB dans `questionnaire_acceptation.reponses`.
Format clé/valeur : `{ "q1": "oui", "q2": "non", "q17": "oui", "q20": "oui", ... }`
Les questions conditionnelles (PPE, PM/PP) sont incluses ou exclues selon le type d'entité du prospect.

**Données** :
- `GET /api/questionnaires/prospect/:id`
- `POST /api/questionnaires` (créer)
- `PATCH /api/questionnaires/:id` (mettre à jour les réponses)
- `PATCH /api/questionnaires/:id/valider`
- `PATCH /api/questionnaires/:id/refuser`

---

### PAGE 6 — `/dashboard/clients` — Liste des clients

**Objectif** : Recherche et navigation dans le portefeuille client.
**Accès** : Tous les rôles.

```
┌─────────────────────────────────────────────────────────────────┐
│  HEADER  "Clients"                                 [+ Nouveau]  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [Recherche: nom, réf, SIRET...]   [Statut: Tous ▼]            │
│                  [Risque: Tous ▼]  [KYC: Tous ▼]               │
│                                                                 │
│  ┌──────┬────────────────────┬───────┬────────┬──────┬──────┐   │
│  │ Réf  │ Raison sociale     │ SIRET │ Statut │ KYC  │Risque│   │
│  ├──────┼────────────────────┼───────┼────────┼──────┼──────┤   │
│  │QW-.. │ SARL Dupont        │123... │ ACTIF  │VALIDE│MOYEN │   │
│  │QW-.. │ SCI Martin         │456... │ ACTIF  │INCOMPLET│FAIBLE│ │
│  │QW-.. │ Jean Lemaire       │   —   │ ACTIF  │COMPLET│ELEVE│  │
│  │ ...  │ ...                │ ...   │ ...    │ ...  │ ...  │   │
│  └──────┴────────────────────┴───────┴────────┴──────┴──────┘   │
│                                                                 │
│  48 clients   [< 1  2  3 >]                                     │
└─────────────────────────────────────────────────────────────────┘
```

**Données** : `GET /api/clients` + `GET /api/scoring/client/:id/courant` pour le niveau de risque

---

### PAGE 7 — `/dashboard/clients/[id]` — Fiche client (onglets)

**Objectif** : Dossier complet d'un client. C'est la page la plus complexe de l'application.
**Accès** : Tous les rôles.

#### En-tête commune à tous les onglets

```
┌────────────────────────────────────────────────────────────────────────┐
│  ← Retour    "SARL Dupont & Associés"     [réf: QW-2026-001]           │
│              SIRET 123 456 789 00012 — 6920Z — Paris                   │
│                                                                        │
│  ● ACTIF    ● KYC VALIDE    ● RISQUE MOYEN (score 52/150)              │
│                                                            [Éditer]    │
├──────────────────────────────────────────────────────────────────────  │
│  [Infos]  [KYC & Docs]  [UBO]  [Contacts]  [Scoring]                  │
│  [Missions]  [Planning]  [Obligations]  [Opérations]                   │
└────────────────────────────────────────────────────────────────────────┘
```

---

#### Onglet 1 — Informations (`?tab=infos`)

```
┌────────────────────────────────────────────────────────────────────────┐
│  ┌─────────────────────────────┐  ┌──────────────────────────────────┐ │
│  │  IDENTIFICATION             │  │  SITUATION ÉCONOMIQUE            │ │
│  │  Raison sociale: SARL...    │  │  CA annuel : 250 000 €           │ │
│  │  SIRET : 123 456 789 00012  │  │  Effectif  : 8 salariés          │ │
│  │  SIREN : 123 456 789        │  │  Nature mission : Comptabilité   │ │
│  │  Forme juridique : SARL     │  │                                  │ │
│  │  Code NAF : 6920Z           │  │  [Actualiser SIRENE 🔄]          │ │
│  │  Créée le : 12/03/2018      │  └──────────────────────────────────┘ │
│  └─────────────────────────────┘                                      │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  ADRESSE DU SIÈGE                                                  │ │
│  │  12 rue du Marché — 75001 Paris — France                          │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  AUDIT TRAIL (10 dernières actions sur ce dossier)                 │ │
│  │  [Jean D.] a modifié [chiffreAffaires] — 15/06/2026 14:32         │ │
│  │  [Marie W.] a créé le scoring — 10/06/2026 09:15                  │ │
│  │  ...                                                               │ │
│  └────────────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────┘
```

---

#### Onglet 2 — KYC & Documents (`?tab=kyc`)

```
┌────────────────────────────────────────────────────────────────────────┐
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  CHECKLIST KYC                                         ██████░ 4/6│ │
│  │  ✅ PPE vérifié                                                    │ │
│  │  ✅ Screening effectué le 12/06/2026  (● OK)                       │ │
│  │  ✅ Bénéficiaires effectifs saisis                                  │ │
│  │  ✅ Pièce d'identité uploadée                                       │ │
│  │  ❌ Kbis manquant ou expiré                                         │ │
│  │  ❌ Statuts constitutifs manquants                                  │ │
│  │                                       [Valider KYC ✓] (RESPONSABLE) │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  DONNÉES KYC                                                     │  │
│  │  PPE : Non  |  Screening : ● OK (12/06/2026)  |  UBO saisi : Oui│  │
│  │  [Modifier PPE]  [Relancer screening]                            │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  DOCUMENTS                                    [+ Uploader]       │  │
│  │  ┌────────────────┬────────────┬────────┬──────────┬──────────┐  │  │
│  │  │ Type           │ Nom        │Taille  │Expiration│ Actions  │  │  │
│  │  ├────────────────┼────────────┼────────┼──────────┼──────────┤  │  │
│  │  │ Pièce identité │ CNI_fr.pdf │ 1.2 Mo │15/08/2028│[↓][🗑] │  │  │
│  │  │ KBIS           │ kbis.pdf   │ 345 Ko │⚠️ EXPIRÉ  │[↓][🗑] │  │  │
│  │  └────────────────┴────────────┴────────┴──────────┴──────────┘  │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

**Données** :
- `GET /api/clients/:id` (kycStatut, ppe, screening…)
- `GET /api/documents?clientId=:id`
- `POST /api/documents` (multipart upload)
- `GET /api/documents/:id/download` → URL pré-signée S3
- `DELETE /api/documents/:id`

---

#### Onglet 3 — Bénéficiaires effectifs (`?tab=beneficiaires`)

```
┌──────────────────────────────────────────────────────────────────────┐
│  BÉNÉFICIAIRES EFFECTIFS (UBO)                     [+ Ajouter UBO]   │
│                                                                      │
│  Obligation : identifier toute personne détenant > 25% du capital   │
│                                                                      │
│  ┌───────────────────────────────────────────────────────────────┐   │
│  │  Jean-Pierre DUPONT             45%  ● PPE : Non              │   │
│  │  Né le : 15/03/1968  |  Nationalité : Française               │   │
│  │  [Modifier]  [Supprimer]                                      │   │
│  ├───────────────────────────────────────────────────────────────┤   │
│  │  Marie DUVAL                    30%  ● PPE : Oui ⚠️            │   │
│  │  Née le : 22/09/1975  |  Nationalité : Belge                  │   │
│  │  [Modifier]  [Supprimer]                                      │   │
│  └───────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  Total détenu : 75% / 100%                                           │
└──────────────────────────────────────────────────────────────────────┘
```

**Modal d'ajout UBO** : Prénom, Nom, Date de naissance, Nationalité, Adresse, % Détention, PPE (oui/non).

**Données** :
- `GET /api/beneficiaires/client/:id`
- `POST /api/beneficiaires`
- `DELETE /api/beneficiaires/:id`

---

#### Onglet 4 — Contacts (`?tab=contacts`)

```
┌──────────────────────────────────────────────────────────────────┐
│  CONTACTS TIERS                                    [+ Ajouter]   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Maître Sophie LEBRUN        ● AVOCAT                   │   │
│  │  sophie.lebrun@barreau.fr   | 01 23 45 67 89            │   │
│  │  [Modifier]  [Supprimer]                                │   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │  Jean-Marc PERRIN            ● COMMISSAIRE AUX COMPTES  │   │
│  │  jm.perrin@audit.fr         | 06 12 34 56 78            │   │
│  │  [Modifier]  [Supprimer]                                │   │
│  └──────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
```

**Données** :
- `GET /api/contacts/client/:id`
- `POST /api/contacts`
- `DELETE /api/contacts/:id`

---

#### Onglet 5 — Scoring ARPEC (`?tab=scoring`)

```
┌────────────────────────────────────────────────────────────────────┐
│  ÉVALUATION DU RISQUE — MÉTHODE ARPEC              [+ Évaluer]     │
│                                                                    │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  SCORE COURANT                                               │  │
│  │                                                              │  │
│  │  ██████████████████░░░░░░░░░  52 / 150                       │  │
│  │                                                              │  │
│  │  ● RISQUE MOYEN (41–80)                                      │  │
│  │  Calculé le 10/06/2026 par Marie Weber                       │  │
│  │                                                              │  │
│  │  Détail des 4 dimensions ARPEC :                             │  │
│  │  Caractéristiques client  : 18/50  ████░░░░░░                │  │
│  │  Activité / secteur       : 15/40  ████░░░░                  │  │
│  │  Zone géographique        : 10/30  ███░░░░                   │  │
│  │  Type de mission          :  9/30  ███░░░░                   │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                    │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  HISTORIQUE DES ÉVALUATIONS                                  │  │
│  │  10/06/2026  Score: 52  MOYEN    Marie W.                    │  │
│  │  15/01/2026  Score: 67  ÉLEVÉ    Jean D.  ↓ amélioration     │  │
│  │  03/09/2025  Score: 82  ÉLEVÉ    Jean D.                     │  │
│  └──────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────┘
```

**Formulaire d'évaluation ARPEC (modale ou page dédiée)** :
- 4 sliders/inputs : Caractéristiques client (0–50), Activité/secteur (0–40), Zone géographique (0–30), Type de mission (0–30)
- Score calculé en temps réel à l'affichage
- Bouton "Enregistrer l'évaluation"

**Données** :
- `GET /api/scoring/client/:id` (historique)
- `GET /api/scoring/client/:id/courant`
- `POST /api/scoring` (nouvelle évaluation)

---

#### Onglet 6 — Missions (`?tab=missions`)

```
┌────────────────────────────────────────────────────────────────────┐
│  MISSIONS                                          [+ Créer mission]│
│                                                                    │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │  ● COMPTABILITÉ — EN COURS                                 │   │
│  │  Du 01/01/2026  —  Honoraires : 4 800 €/an                 │   │
│  │  "Tenue de comptabilité et établissement des comptes"      │   │
│  │                                                            │   │
│  │  Lettre de mission v2 — Signée ✓ (20/03/2026)              │   │
│  │  [Voir la lettre]  [Générer nouvelle version]              │   │
│  │  [Suspendre]  [Terminer]  [Résilier]                       │   │
│  └────────────────────────────────────────────────────────────┘   │
│                                                                    │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │  ● CONSEIL FISCAL — TERMINÉE                               │   │
│  │  Du 01/03/2025 au 30/06/2025 — Honoraires : 1 200 €        │   │
│  │  Lettre de mission v1 — Signée ✓                           │   │
│  └────────────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────────┘
```

**Données** :
- `GET /api/missions?clientId=:id`
- `POST /api/missions`
- `PATCH /api/missions/:id/statut`
- `GET /api/lettres-mission?missionId=:id`
- `POST /api/lettres-mission`
- `PATCH /api/lettres-mission/:id/signer` (EXPERT_COMPTABLE seulement)

---

#### Onglet 7 — Planning (`?tab=planning`)

```
┌────────────────────────────────────────────────────────────────────┐
│  PLANNING & DILIGENCES                           [+ Ajouter étape] │
│                                                                    │
│  ┌──────┬──────────────────────────────┬──────────┬───────────┐   │
│  │Statut│ Titre                        │ Échéance │ Assigné à │   │
│  ├──────┼──────────────────────────────┼──────────┼───────────┤   │
│  │  ✅  │ Vérification KYC annuelle   │01/06/2026│Jean D.    │   │
│  │  🔄  │ Mise à jour Kbis             │30/06/2026│Marie W.   │   │
│  │  ⚠️  │ Évaluation risque annuelle  │15/06/2026│Jean D.    │   │
│  │  □   │ Renouvellement lettre mission│01/01/2027│—          │   │
│  └──────┴──────────────────────────────┴──────────┴───────────┘   │
│                                                                    │
│  [RÉGLEMENTAIRE]  [MANUELLE]  (filtres par type)                   │
└────────────────────────────────────────────────────────────────────┘
```

**Données** :
- `GET /api/planning?clientId=:id`
- `POST /api/planning`
- `PATCH /api/planning/:id/completer`
- `DELETE /api/planning/:id`

---

#### Onglet 8 — Obligations (`?tab=obligations`)

```
┌────────────────────────────────────────────────────────────────────┐
│  OBLIGATIONS RÉGLEMENTAIRES LCB-FT                                 │
│                                                                    │
│  ┌────────────────────────────────┬──────────┬──────────────────┐  │
│  │ Obligation                     │ Statut   │ Échéance         │  │
│  ├────────────────────────────────┼──────────┼──────────────────┤  │
│  │ Vérification d'identité KYC   │ ✅ FAIT  │ —                │  │
│  │ Évaluation du risque           │ ✅ FAIT  │ Prochaine : 2027 │  │
│  │ Mise à jour des documents      │ ⚠️ RETARD│ 01/06/2026 ❗   │  │
│  │ Validation relation d'affaires │ ✅ FAIT  │ —                │  │
│  │ Lettre de mission signée       │ ✅ FAIT  │ —                │  │
│  └────────────────────────────────┴──────────┴──────────────────┘  │
│                                                                    │
│  Conformité globale : 4/5  ████████░░                              │
└────────────────────────────────────────────────────────────────────┘
```

**Données** :
- `GET /api/obligations?clientId=:id`
- `PATCH /api/obligations/:id/fait`

---

#### Onglet 9 — Opérations sensibles (`?tab=operations`)

```
┌────────────────────────────────────────────────────────────────────┐
│  OPÉRATIONS SENSIBLES                            [+ Signaler]       │
│                                                                    │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  03/06/2026 — ● SIGNALÉE                                     │  │
│  │  Type : Transaction en espèces                               │  │
│  │  "Paiement de 12 000 € en espèces pour règlement de factures"│  │
│  │  Montant : 12 000 € EUR                                      │  │
│  │  Signalée par : Jean Dupont                                  │  │
│  │  [En analyse]  [Classer]  [TRACFIN déclaré le ___]           │  │
│  ├──────────────────────────────────────────────────────────────┤  │
│  │  15/01/2026 — ● CLASSÉE                                      │  │
│  │  Type : Sans justification économique                        │  │
│  │  Classée le 20/01/2026 par Marie Weber                       │  │
│  └──────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────┘
```

**Données** :
- `GET /api/operations-sensibles?clientId=:id`
- `POST /api/operations-sensibles`
- `PATCH /api/operations-sensibles/:id/classer`
- `PATCH /api/operations-sensibles/:id/tracfin` (enregistrer la date de déclaration externe)

---

### PAGE 8 — `/dashboard/cartographie` — Cartographie globale des risques

**Objectif** : Vue synthétique du niveau de risque de tout le portefeuille.
**Accès** : RESPONSABLE, EXPERT_COMPTABLE, ADMIN.

```
┌────────────────────────────────────────────────────────────────────────┐
│  HEADER  "Cartographie des risques"                 [Exporter PDF]     │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                    │
│  │  FAIBLE      │  │  MOYEN       │  │  ÉLEVÉ       │                   │
│  │  ● 28 clients │  │  ● 15 clients│  │  ● 4 clients │                   │
│  │  (60%)       │  │  (32%)       │  │  (8%) ⚠️    │                   │
│  └─────────────┘  └─────────────┘  └─────────────┘                    │
│                                                                        │
│  [Filtre: Risque ▼]  [Filtre: Secteur ▼]  [Recherche...]              │
│                                                                        │
│  ┌────────┬─────────────────────┬────────┬──────────┬──────────────┐  │
│  │ Réf    │ Raison sociale      │ Score  │ Niveau   │ Dernière éval │  │
│  ├────────┼─────────────────────┼────────┼──────────┼──────────────┤  │
│  │ QW-001 │ SCI Les Palmiers    │ 125/150│ ● ÉLEVÉ  │ 01/06/2026   │  │
│  │ QW-012 │ Crypto Assets SAS   │  98/150│ ● ÉLEVÉ  │ 15/05/2026   │  │
│  │ QW-007 │ SARL Dupont         │  52/150│ ● MOYEN  │ 10/06/2026   │  │
│  │ ...    │ ...                 │  ...   │ ...      │ ...          │  │
│  └────────┴─────────────────────┴────────┴──────────┴──────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

---

### PAGE 9 — `/dashboard/obligations` — Tableau global des obligations

**Objectif** : Vue globale de toutes les obligations en retard ou à faire sur le portefeuille.
**Accès** : RESPONSABLE, EXPERT_COMPTABLE, ADMIN.

```
┌────────────────────────────────────────────────────────────────────────┐
│  HEADER  "Obligations réglementaires"       [Filtre: En retard ▼]      │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐               │
│  │ À faire  │  │  En cours │  │ En retard│  │  Expirés  │              │
│  │    12    │  │     5     │  │    7 ⚠️  │  │    2 ❗  │              │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘               │
│                                                                        │
│  ┌────────┬─────────────────┬──────────────────────┬────────┬───────┐  │
│  │ Client │ Raison sociale  │ Obligation           │Échéance│Statut │  │
│  ├────────┼─────────────────┼──────────────────────┼────────┼───────┤  │
│  │QW-001  │ SCI Les Palmiers│ Mise à jour docs      │01/06   │ ❗EN  │  │
│  │QW-007  │ SARL Dupont     │ Évaluation risque     │30/06   │ ⚠️   │  │
│  │QW-012  │ Crypto Assets   │ KYC vérification      │15/06   │ ⚠️   │  │
│  └────────┴─────────────────┴──────────────────────┴────────┴───────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

---

### PAGE 10 — `/dashboard/operations-sensibles` — Vue globale

**Objectif** : Supervision de toutes les opérations sensibles du cabinet.
**Accès** : RESPONSABLE, EXPERT_COMPTABLE, ADMIN.

```
┌────────────────────────────────────────────────────────────────────────┐
│  HEADER  "Opérations sensibles"          [Filtre: Signalées ▼]         │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐        │
│  │Signalées │  │En analyse│  │  Classées │  │ TRACFIN déclaré  │        │
│  │    3     │  │    1     │  │   12      │  │       4          │        │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────────┘        │
│                                                                        │
│  ┌───────┬──────────────┬────────────┬──────────┬───────────┬───────┐  │
│  │ Date  │ Client       │ Type       │ Montant  │ Statut    │Action │  │
│  ├───────┼──────────────┼────────────┼──────────┼───────────┼───────┤  │
│  │03/06  │ SARL Dupont  │ Espèces    │ 12 000 € │ SIGNALÉE  │[Voir] │  │
│  │15/05  │ SCI Palmiers │ Sans justif│    —     │ EN ANALYSE│[Voir] │  │
│  └───────┴──────────────┴────────────┴──────────┴───────────┴───────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

---

### PAGE 11 — `/dashboard/planning` — Planning global cabinet

**Objectif** : Calendrier de toutes les diligences planifiées du cabinet.
**Accès** : RESPONSABLE, ADMIN.

```
┌───────────────────────────────────────────────────────────────────┐
│  HEADER  "Planning cabinet"     [Vue: Liste ▼]  [Collaborateur ▼] │
├───────────────────────────────────────────────────────────────────┤
│                                                                   │
│  JUILLET 2026                                                     │
│                                                                   │
│  ┌─────┬───────────────────────────┬──────────┬──────────────┐    │
│  │Stat │ Étape                     │ Client   │ Assigné      │    │
│  ├─────┼───────────────────────────┼──────────┼──────────────┤    │
│  │ ⚠️  │ Mise à jour Kbis          │SARL D.   │Jean Dupont   │    │
│  │ ⚠️  │ Évaluation risque annuelle│SCI P.    │Marie Weber   │    │
│  │ □   │ Renouvellement LM         │Crypto A. │Jean Dupont   │    │
│  └─────┴───────────────────────────┴──────────┴──────────────┘    │
│                                                                   │
│  AOÛT 2026                                                        │
│  ...                                                              │
└───────────────────────────────────────────────────────────────────┘
```

---

### PAGE 12 — `/dashboard/admin/users` — Gestion des utilisateurs

**Objectif** : Gérer les comptes du cabinet.
**Accès** : ADMIN uniquement.

```
┌───────────────────────────────────────────────────────────────────┐
│  HEADER  "Utilisateurs"                        [+ Nouvel utilisateur]│
├───────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────┬───────────────┬──────────────────┬────────┬───────┐ │
│  │ Prénom   │ Nom           │ Email            │ Rôle   │ Actif │ │
│  ├──────────┼───────────────┼──────────────────┼────────┼───────┤ │
│  │ Jean     │ Dupont        │ jd@qw.fr         │ Collab │ ✅    │ │
│  │ Marie    │ Weber         │ mw@qw.fr         │ Resp.  │ ✅    │ │
│  │ Paul     │ Expert        │ pe@qw.fr         │ Expert │ ✅    │ │
│  │ Admin    │ QW            │ admin@qw-app.fr  │ Admin  │ ✅    │ │
│  └──────────┴───────────────┴──────────────────┴────────┴───────┘ │
│                                                                   │
│  [Modifier]  [Désactiver]  (par ligne)                            │
└───────────────────────────────────────────────────────────────────┘
```

**Sous-page** `/admin/users/new` : Formulaire prénom, nom, email, rôle, mot de passe initial.
**Sous-page** `/admin/users/[id]` : Modifier prénom, nom, rôle, actif/inactif, réinitialiser mdp.

---

## 6. Composants partagés à créer

| Composant | Description | Usage |
|-----------|-------------|-------|
| `<StatusBadge>` | Badge coloré selon le statut | Partout |
| `<RiskBadge>` | Badge FAIBLE / MOYEN / ÉLEVÉ avec couleur | Scoring, cartographie |
| `<KycBadge>` | Badge statut KYC | Fiche client |
| `<KanbanBoard>` | Colonnes drag-and-drop | Prospects |
| `<KanbanCard>` | Carte prospect | Kanban |
| `<ClientHeader>` | En-tête fiche client + onglets | Fiche client |
| `<SiretInput>` | Input SIRET + bouton SIRENE | Formulaires prospect/client |
| `<DocumentUpload>` | Upload fichier avec type | Onglet KYC |
| `<DocumentRow>` | Ligne document avec statut expiration | Liste documents |
| `<ObligationRow>` | Ligne obligation avec statut coloré | Onglet obligations |
| `<ArpecForm>` | Formulaire 4 dimensions ARPEC | Scoring |
| `<ScoreBar>` | Barre de progression du score | Scoring |
| `<ConfirmModal>` | Modale de confirmation destructive | Partout |
| `<EmptyState>` | Placeholder "Aucun élément" | Partout |
| `<PageHeader>` | En-tête de page avec titre + actions | Partout |

---

## 7. Ordre d'implémentation recommandé

### Sprint 1 — Fondations

```
1. Réécrire src/types/index.ts
2. Mettre à jour AppSidebar.tsx (nouveaux liens)
3. Mettre à jour useAuth.ts (enum Role UPPERCASE)
4. Composants partagés : StatusBadge, RiskBadge, KycBadge, PageHeader, EmptyState, ConfirmModal
```

### Sprint 2 — Module Prospects (Kanban)

```
5.  /dashboard/prospects → page Kanban (KanbanBoard + KanbanCard)
6.  /dashboard/prospects/new → formulaire + intégration SIRENE
7.  /dashboard/prospects/[id] → fiche prospect
8.  /dashboard/prospects/[id]/questionnaire → formulaire d'acceptation
```

### Sprint 3 — Module Client (fiche principale)

```
9.  /dashboard/clients → liste avec filtres
10. /dashboard/clients/new → formulaire + SIRENE
11. /dashboard/clients/[id] onglet Infos + layout onglets (ClientHeader)
12. /dashboard/clients/[id] onglet KYC & Documents (DocumentUpload, checklist KYC)
```

### Sprint 4 — Module Client (onglets complémentaires)

```
13. onglet UBO (BeneficiaireEffectif CRUD)
14. onglet Contacts (Contact CRUD)
15. onglet Scoring (ArpecForm + ScoreBar + historique)
16. onglet Missions + Lettres de mission
```

### Sprint 5 — Module Client (obligations + opérations)

```
17. onglet Planning (CRUD + marquer fait)
18. onglet Obligations (liste + marquer fait)
19. onglet Opérations sensibles (signaler + classer + TRACFIN date)
```

### Sprint 6 — Vues globales

```
20. /dashboard (refonte KPIs)
21. /dashboard/cartographie (vue portefeuille risques)
22. /dashboard/obligations (tableau global)
23. /dashboard/operations-sensibles (vue globale)
24. /dashboard/planning (planning cabinet)
```

### Sprint 7 — Administration

```
25. /dashboard/admin/users (liste)
26. /dashboard/admin/users/new (formulaire)
27. /dashboard/admin/users/[id] (modification)
```

---

## 8. Gestion des droits RBAC côté frontend

Créer un hook `useRole()` et un composant `<Guard>` pour afficher/masquer les actions selon le rôle :

```typescript
// src/hooks/useRole.ts
import { useAuth } from './useAuth';
import type { Role } from '@/types';

export function useRole() {
  const { user } = useAuth();
  const role = user?.role;

  return {
    role,
    isAdmin: role === 'ADMIN',
    isExpert: role === 'EXPERT_COMPTABLE' || role === 'ADMIN',
    isResponsable: role === 'RESPONSABLE' || role === 'EXPERT_COMPTABLE' || role === 'ADMIN',
    isCollaborateur: true,
    can: {
      validerQuestionnaire: ['RESPONSABLE', 'EXPERT_COMPTABLE', 'ADMIN'].includes(role ?? ''),
      convertirProspect:    ['RESPONSABLE', 'EXPERT_COMPTABLE', 'ADMIN'].includes(role ?? ''),
      signerLettre:         ['EXPERT_COMPTABLE', 'ADMIN'].includes(role ?? ''),
      exporterRapport:      ['RESPONSABLE', 'EXPERT_COMPTABLE', 'ADMIN'].includes(role ?? ''),
      gererUtilisateurs:    role === 'ADMIN',
      supprimerDossier:     role === 'ADMIN',
    },
  };
}
```

```tsx
// src/components/Guard.tsx
export function Guard({ roles, children }: { roles: Role[], children: React.ReactNode }) {
  const { role } = useRole();
  if (!role || !roles.includes(role)) return null;
  return <>{children}</>;
}

// Utilisation :
<Guard roles={['RESPONSABLE', 'EXPERT_COMPTABLE', 'ADMIN']}>
  <Button>Valider</Button>
</Guard>
```

---

## 9. Récapitulatif des pages

| # | Route | Statut | Priorité |
|---|-------|--------|----------|
| 1 | `/dashboard` | ♻️ Réécrire | Sprint 6 |
| 2 | `/dashboard/prospects` | ♻️ Kanban | Sprint 2 |
| 3 | `/dashboard/prospects/new` | ♻️ Réécrire | Sprint 2 |
| 4 | `/dashboard/prospects/[id]` | ♻️ Réécrire | Sprint 2 |
| 5 | `/dashboard/prospects/[id]/questionnaire` | 🆕 Créer | Sprint 2 |
| 6 | `/dashboard/clients` | ♻️ Adapter | Sprint 3 |
| 7 | `/dashboard/clients/new` | ♻️ Réécrire | Sprint 3 |
| 8 | `/dashboard/clients/[id]` tab=infos | ♻️ Réécrire | Sprint 3 |
| 9 | `/dashboard/clients/[id]` tab=kyc | 🆕 Créer | Sprint 3 |
| 10 | `/dashboard/clients/[id]` tab=beneficiaires | 🆕 Créer | Sprint 4 |
| 11 | `/dashboard/clients/[id]` tab=contacts | 🆕 Créer | Sprint 4 |
| 12 | `/dashboard/clients/[id]` tab=scoring | ♻️ Réécrire | Sprint 4 |
| 13 | `/dashboard/clients/[id]` tab=missions | 🆕 Créer | Sprint 4 |
| 14 | `/dashboard/clients/[id]` tab=planning | 🆕 Créer | Sprint 5 |
| 15 | `/dashboard/clients/[id]` tab=obligations | 🆕 Créer | Sprint 5 |
| 16 | `/dashboard/clients/[id]` tab=operations | 🆕 Créer | Sprint 5 |
| 17 | `/dashboard/cartographie` | 🆕 Créer | Sprint 6 |
| 18 | `/dashboard/obligations` | 🆕 Créer | Sprint 6 |
| 19 | `/dashboard/operations-sensibles` | 🆕 Créer | Sprint 6 |
| 20 | `/dashboard/planning` | 🆕 Créer | Sprint 6 |
| 21 | `/dashboard/admin/users` | ♻️ Réécrire | Sprint 7 |
| 22 | `/dashboard/admin/users/new` | 🆕 Créer | Sprint 7 |
| 23 | `/dashboard/admin/users/[id]` | 🆕 Créer | Sprint 7 |

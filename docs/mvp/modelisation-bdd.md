# Modélisation de la base de données — QW-App LCB-FT

> Méthodologie Merise : MCD → MLD → Entités TypeORM

---

## 1. Décisions de conception préalables

### 1.1 KYC fusionné dans Client

La fiche KYC (statut, PPE, screening…) est en relation 1-1 stricte avec le client. Une table séparée n'apporterait que de la complexité : JOIN systématique, deux entités à maintenir, cascade à gérer. Les champs KYC sont donc directement dans la table `client`.

Ce qui reste **séparé** :
- `beneficiaire_effectif` → relation 0-N (un client peut avoir plusieurs BE)
- `document` → relation 0-N (stockage S3, types variés)

### 1.2 UUID pour toutes les clés primaires

Les entiers auto-incrémentés permettent l'énumération des ressources (`GET /clients/42`). L'UUID supprime ce vecteur d'attaque.

### 1.3 Soft delete sur `client` et `utilisateur`

L'obligation LCB-FT impose une **rétention de 5 ans** après la fin de la relation (art. L.561-12 CMF). La suppression physique immédiate est une violation réglementaire.

### 1.4 `score_risque` est une table avec historique

Chaque évaluation ARPEC crée une **nouvelle ligne horodatée**. Cela permet de tracer l'évolution du risque dans le temps (obligation de surveillance continue, art. L.561-6 CMF). Le score courant = la ligne avec le `created_at` le plus récent pour un `client_id` donné.

### 1.5 `reponses JSONB` dans les questionnaires

Les réponses aux questionnaires sont stockées en JSONB PostgreSQL. Avantages : le schéma peut évoluer sans migration, les données restent queryables, et la structure est auto-documentée.

---

## 2. Entités (14)

| # | Entité | Description |
|---|--------|-------------|
| 1 | **Utilisateur** | Compte interne (collaborateur, responsable, expert-comptable, admin) |
| 2 | **Prospect** | Contact commercial en cours d'évaluation (pipeline Kanban) |
| 3 | **QuestionnaireAcceptation** | Décision formelle d'entrée en relation d'affaires |
| 4 | **Client** | Relation d'affaires acceptée — contient les champs KYC |
| 5 | **BeneficiaireEffectif** | UBO lié à un client (>25 % du capital ou contrôle effectif) |
| 6 | **Contact** | Tiers liés au client (avocat, commissaire aux comptes, notaire…) |
| 7 | **Document** | Fichier stocké sur S3 (pièce d'identité, Kbis, annexe…) |
| 8 | **ScoreRisque** | Évaluation de risque ARPEC horodatée — une ligne par évaluation |
| 9 | **Mission** | Engagement contractuel cabinet ↔ client |
| 10 | **LettreMission** | Document signé lié à une mission (versionnée) |
| 11 | **PlanningEtape** | Diligence ou tâche planifiée sur un dossier |
| 12 | **Obligation** | Obligation réglementaire LCB-FT à satisfaire |
| 13 | **OperationSensible** | Opération atypique signalée pour analyse (potentiellement TRACFIN) |
| 14 | **AuditLog** | Journal immuable de toutes les actions |

---

## 3. MCD — Modèle Conceptuel de Données

### 3.1 Associations et cardinalités

| Association | Entité A | Card. A | Card. B | Entité B | Règle |
|-------------|---------|:-------:|:-------:|---------|-------|
| crée | Utilisateur | 1,N | 0,N | Prospect | Un utilisateur crée plusieurs prospects |
| assigne | Utilisateur | 0,N | 0,1 | Prospect | Un prospect est assigné à un collaborateur |
| possède | Prospect | 1,1 | 0,1 | QuestionnaireAcceptation | Un prospect a au plus un questionnaire |
| valide | Utilisateur | 0,N | 0,1 | QuestionnaireAcceptation | Un responsable valide le questionnaire |
| converti_en | Prospect | 0,1 | 0,1 | Client | Un prospect converti devient un client unique |
| crée | Utilisateur | 1,N | 0,N | Client | Un utilisateur est responsable de plusieurs clients |
| détient | Client | 1,1 | 0,N | BeneficiaireEffectif | Un client peut avoir 0 ou N bénéficiaires effectifs |
| a | Client | 1,1 | 0,N | Contact | Un client a 0 ou N contacts tiers |
| attache | Client | 1,1 | 0,N | Document | Un client possède plusieurs documents |
| attache | Mission | 1,1 | 0,N | Document | Une mission peut avoir des documents spécifiques |
| évalue | Client | 1,1 | 0,N | ScoreRisque | Historique de toutes les évaluations ARPEC |
| calcule | Utilisateur | 1,N | 0,N | ScoreRisque | Un utilisateur déclenche un calcul de score |
| a | Client | 1,1 | 0,N | Mission | Un client peut avoir plusieurs missions |
| génère | Mission | 1,1 | 0,N | LettreMission | Une mission a plusieurs versions de lettres |
| signe | Utilisateur | 0,N | 0,1 | LettreMission | Un expert-comptable signe une lettre |
| planifie | Client | 1,1 | 0,N | PlanningEtape | Un client a des étapes planifiées |
| complète | Utilisateur | 0,N | 0,1 | PlanningEtape | Un utilisateur complète une étape |
| suit | Client | 1,1 | 0,N | Obligation | Suivi des obligations réglementaires |
| déclare | Client | 1,1 | 0,N | OperationSensible | Un client peut avoir des opérations signalées |
| signale | Utilisateur | 1,N | 0,N | OperationSensible | Un utilisateur signale une opération |
| logue | Utilisateur | 1,N | 0,N | AuditLog | Toutes les actions sont journalisées |

### 3.2 Diagramme

```
                     ┌────────────────────────────────────────────────────┐
                     │                   Utilisateur                      │
                     │  id · prénom · nom · email · role · actif           │
                     └───┬──────────────────────────────────────────┬─────┘
                         │ crée / assigne                           │ logue
                         │                                          │
                         ▼                                          ▼
                    ┌──────────┐                             ┌────────────┐
                    │ Prospect │──────possède (0,1)─────────►│Questionnaire│
                    │          │                             │Acceptation  │
                    └────┬─────┘                             └────────────┘
                         │
                  converti_en (0,1)
                         │
                         ▼
┌────────────────────────────────────────────────────────────────────────────┐
│                                  Client                                     │
│  ── Identification ──                    ── KYC (fusionné) ──              │
│  id · ref · siret · siren               kyc_statut · ppe · ppe_detail      │
│  raison_sociale · type_entite           ubo_saisi                          │
│  forme_juridique · code_naf             screening_statut · screening_date  │
│  activite_principale · date_creation    kyc_completed_at · kyc_validated_by│
│  adresse · ville · code_postal · pays                                      │
│  chiffre_affaires · effectif            ── Meta ──                         │
│  nature_mission · statut                created_by · created_at            │
│  sirene_updated_at                      updated_at · deleted_at            │
└──────────────────────────────────────┬─────────────────────────────────────┘
                                       │
          ┌──────────┬─────────────────┼──────────────┬───────────────┐
          │          │                 │              │               │
          ▼          ▼                 ▼              ▼               ▼
  Beneficiaire    Contact          Mission       ScoreRisque     PlanningEtape
  Effectif                            │          (historique)
                                      │
                                 LettreMission
          │          │                 │              │               │
          │          └─────────────────┼──────────────┴───────────────┤
          │                            │                               │
          │                         Document ◄── mission_id (nullable)│
          └──────────────────────────────────────────────────────────►┘

Client ──► Obligation
Client ──► OperationSensible
Utilisateur ──► AuditLog
```

---

## 4. MLD — Modèle Logique de Données

### utilisateur
```
utilisateur(
  id            UUID        PK,
  prenom        VARCHAR(50),
  nom           VARCHAR(50),
  email         VARCHAR(255)  UNIQUE NOT NULL,
  password      VARCHAR(255)  NOT NULL,
  role          ENUM('COLLABORATEUR', 'RESPONSABLE', 'EXPERT_COMPTABLE', 'ADMIN'),
  actif         BOOLEAN       DEFAULT TRUE,
  created_at    TIMESTAMP,
  deleted_at    TIMESTAMP?
)
```

### prospect
```
prospect(
  id                UUID        PK,
  ref               VARCHAR(20)   UNIQUE NOT NULL,
  siret             VARCHAR(14)?,
  nom               VARCHAR(255)  NOT NULL,
  email             VARCHAR(255)?,
  telephone         VARCHAR(20)?,
  type_entite       ENUM('PERSONNE_PHYSIQUE', 'PERSONNE_MORALE'),
  statut_kanban     ENUM('PRISE_CONTACT', 'DECOUVERTE', 'OPPORTUNITE',
                         'LAB', 'PREPARATION', 'CONVERTI', 'REFUSE'),
  motif_refus       TEXT?,
  activite          VARCHAR(255)?,
  code_naf          VARCHAR(10)?,
  adresse           TEXT?,
  ville             VARCHAR(100)?,
  code_postal       VARCHAR(10)?,
  pays              VARCHAR(100)  DEFAULT 'France',
  chiffre_affaires  DECIMAL(15,2)?,
  effectif          INTEGER?,
  created_by        UUID          FK → utilisateur(id),
  assigned_to       UUID?         FK → utilisateur(id),
  created_at        TIMESTAMP,
  updated_at        TIMESTAMP,
  deleted_at        TIMESTAMP?
)
```

### questionnaire_acceptation
```
questionnaire_acceptation(
  id              UUID        PK,
  prospect_id     UUID          FK → prospect(id)    UNIQUE NOT NULL,
  statut          ENUM('EN_COURS', 'VALIDE', 'REFUSE'),
  reponses        JSONB,
  motif_refus     TEXT?,
  validated_by    UUID?         FK → utilisateur(id),
  validated_at    TIMESTAMP?,
  created_by      UUID          FK → utilisateur(id),
  created_at      TIMESTAMP
)
```

### client
```
client(
  id                          UUID        PK,
  ref                         VARCHAR(20)   UNIQUE NOT NULL,
  prospect_id                 UUID?         FK → prospect(id)   UNIQUE,
  siret                       VARCHAR(14)?,
  siren                       VARCHAR(9)?,
  raison_sociale              VARCHAR(255)  NOT NULL,
  type_entite                 ENUM('PERSONNE_PHYSIQUE', 'PERSONNE_MORALE'),
  forme_juridique             VARCHAR(100)?,
  code_naf                    VARCHAR(10)?,
  activite_principale         VARCHAR(255)?,
  date_creation_entreprise    DATE?,
  adresse_siege               TEXT?,
  ville                       VARCHAR(100)?,
  code_postal                 VARCHAR(10)?,
  pays                        VARCHAR(100)  DEFAULT 'France',
  chiffre_affaires            DECIMAL(15,2)?,
  effectif                    INTEGER?,
  nature_mission              TEXT?,
  statut                      ENUM('ACTIF', 'INACTIF', 'RESILIE')  DEFAULT 'ACTIF',
  sirene_updated_at           TIMESTAMP?,

  -- Champs KYC (fusionnés)
  kyc_statut                  ENUM('INCOMPLET', 'COMPLET', 'VALIDE', 'EXPIRE')
                              DEFAULT 'INCOMPLET',
  ppe                         BOOLEAN       DEFAULT FALSE,
  ppe_detail                  TEXT?,
  ubo_saisi                   BOOLEAN       DEFAULT FALSE,
  screening_statut            ENUM('NON_EFFECTUE', 'OK', 'ALERTE')
                              DEFAULT 'NON_EFFECTUE',
  screening_date              TIMESTAMP?,
  kyc_completed_at            TIMESTAMP?,
  kyc_validated_by            UUID?         FK → utilisateur(id),

  created_by                  UUID          FK → utilisateur(id),
  created_at                  TIMESTAMP,
  updated_at                  TIMESTAMP,
  deleted_at                  TIMESTAMP?
)
```

### beneficiaire_effectif
```
beneficiaire_effectif(
  id                      UUID        PK,
  client_id               UUID          FK → client(id)  NOT NULL,
  prenom                  VARCHAR(50),
  nom                     VARCHAR(100)  NOT NULL,
  date_naissance          DATE?,
  nationalite             VARCHAR(100)?,
  adresse                 TEXT?,
  pourcentage_detention   DECIMAL(5,2)  NOT NULL,
  ppe                     BOOLEAN       DEFAULT FALSE,
  created_at              TIMESTAMP
)
```

### contact
```
contact(
  id          UUID        PK,
  client_id   UUID          FK → client(id)  NOT NULL,
  prenom      VARCHAR(50)?,
  nom         VARCHAR(100)  NOT NULL,
  email       VARCHAR(255)?,
  telephone   VARCHAR(20)?,
  type        ENUM('INTERVENANT', 'AVOCAT', 'COMMISSAIRE_COMPTES',
                   'NOTAIRE', 'AUTRE'),
  role_detail TEXT?,
  created_at  TIMESTAMP
)
```

### document
```
document(
  id              UUID        PK,
  client_id       UUID          FK → client(id)   NOT NULL,
  mission_id      UUID?         FK → mission(id),
  type            ENUM('PIECE_IDENTITE', 'JUSTIFICATIF_DOMICILE', 'KBIS',
                       'STATUTS', 'LISTE_UBO', 'ATTESTATION_PPE',
                       'JUSTIFICATIF_FONDS', 'LETTRE_MISSION',
                       'RAPPORT', 'ANNEXE', 'AUTRE'),
  nom             VARCHAR(255)  NOT NULL,
  mime_type       VARCHAR(100)  NOT NULL,
  taille_octets   INTEGER       NOT NULL,
  s3_key          VARCHAR(500)  UNIQUE NOT NULL,
  expires_at      TIMESTAMP?,
  relance_at      TIMESTAMP?,
  uploaded_by     UUID          FK → utilisateur(id),
  created_at      TIMESTAMP
)
```

### score_risque
```
score_risque(
  id              UUID        PK,
  client_id       UUID          FK → client(id)        NOT NULL,
  score           INTEGER       CHECK(score BETWEEN 0 AND 150),
  niveau          ENUM('FAIBLE', 'MOYEN', 'ELEVE'),
  reponses        JSONB         NOT NULL,
  calculated_by   UUID          FK → utilisateur(id),
  created_at      TIMESTAMP
)
-- Chaque évaluation = une nouvelle ligne. Pas de UPDATE.
-- Score courant = MAX(created_at) pour un client_id donné.
```

### mission
```
mission(
  id            UUID        PK,
  client_id     UUID          FK → client(id)        NOT NULL,
  type          ENUM('COMPTABILITE', 'AUDIT', 'CONSEIL', 'JURIDIQUE', 'AUTRE'),
  description   TEXT?,
  statut        ENUM('EN_COURS', 'SUSPENDUE', 'TERMINEE', 'RESILIEE')
                DEFAULT 'EN_COURS',
  date_debut    DATE          NOT NULL,
  date_fin      DATE?,
  honoraires    DECIMAL(10,2)?,
  created_by    UUID          FK → utilisateur(id),
  created_at    TIMESTAMP,
  updated_at    TIMESTAMP
)
```

### lettre_mission
```
lettre_mission(
  id                  UUID        PK,
  mission_id          UUID          FK → mission(id)       NOT NULL,
  version             INTEGER       DEFAULT 1,
  contenu             JSONB         NOT NULL,
  signee_par_expert   BOOLEAN       DEFAULT FALSE,
  signee_at           TIMESTAMP?,
  signataire_id       UUID?         FK → utilisateur(id),
  s3_key              VARCHAR(500)?,
  created_at          TIMESTAMP
)
```

### planning_etape
```
planning_etape(
  id              UUID        PK,
  client_id       UUID          FK → client(id)        NOT NULL,
  titre           VARCHAR(255)  NOT NULL,
  description     TEXT?,
  type            ENUM('REGLEMENTAIRE', 'MANUELLE'),
  statut          ENUM('A_FAIRE', 'EN_COURS', 'FAIT', 'ANNULEE')  DEFAULT 'A_FAIRE',
  date_echeance   DATE?,
  completed_at    TIMESTAMP?,
  completed_by    UUID?         FK → utilisateur(id),
  assigned_to     UUID?         FK → utilisateur(id),
  created_by      UUID          FK → utilisateur(id),
  created_at      TIMESTAMP
)
```

### obligation
```
obligation(
  id              UUID        PK,
  client_id       UUID          FK → client(id)        NOT NULL,
  type            ENUM('KYC_VERIFICATION', 'EVALUATION_RISQUE', 'MISE_A_JOUR_DOCS',
                       'VALIDATION_RELATION', 'LETTRE_MISSION'),
  statut          ENUM('A_FAIRE', 'FAIT', 'EN_RETARD', 'EXPIRE')  DEFAULT 'A_FAIRE',
  date_echeance   DATE?,
  completed_at    TIMESTAMP?,
  created_at      TIMESTAMP,
  updated_at      TIMESTAMP
)
```

### operation_sensible
```
operation_sensible(
  id              UUID        PK,
  client_id       UUID          FK → client(id)        NOT NULL,
  type            ENUM('SANS_JUSTIFICATION', 'COMPLEXE', 'SANS_OBJET_LICITE',
                       'INHABITUELLE', 'ECONOMIE_VIRTUELLE', 'ESPECES', 'AUTRE'),
  description     TEXT          NOT NULL,
  montant         DECIMAL(15,2)?,
  devise          VARCHAR(3)?,
  statut          ENUM('SIGNALEE', 'EN_ANALYSE', 'CLASSEE', 'TRACFIN_DECLARE')
                  DEFAULT 'SIGNALEE',
  tracfin_date    TIMESTAMP?,
  validated_by    UUID?         FK → utilisateur(id),
  validated_at    TIMESTAMP?,
  signale_by      UUID          FK → utilisateur(id)  NOT NULL,
  created_at      TIMESTAMP
)
```

### audit_log
```
audit_log(
  id              UUID        PK,
  user_id         UUID          FK → utilisateur(id)  NOT NULL,
  action          VARCHAR(50)   NOT NULL,
  ressource       VARCHAR(50)   NOT NULL,
  ressource_id    UUID          NOT NULL,
  details         JSONB?,
  ip_address      VARCHAR(45)?,
  created_at      TIMESTAMP
)
-- Table en INSERT-ONLY : aucun UPDATE ni DELETE autorisé.
```

---

## 5. Schéma relationnel — vue d'ensemble

```
utilisateur
    ├── crée ──────────────► prospect ──── possède (0,1) ──► questionnaire_acceptation
    │                            │
    │                    converti_en (0,1)
    │                            │
    ├── crée ──────────────► client  ◄────── prospect_id? (UNIQUE)
    │                          │
    │         ┌────────────────┼────────────────────────────┐
    │         │                │                            │
    │         ▼                ▼                            ▼
    │   beneficiaire       score_risque                  mission
    │   _effectif          (historique)                     │
    │                                                  lettre_mission
    │         │                │                            │
    │         ▼                ▼                            ▼
    │       contact         document ◄─────────── mission_id? (nullable)
    │
    │       planning_etape
    │       obligation
    │       operation_sensible
    │
    └── logue ─────────────► audit_log
```

---

## 6. Index recommandés

```sql
-- Kanban : filtrer les prospects par statut
CREATE INDEX idx_prospect_statut ON prospect(statut_kanban)
  WHERE deleted_at IS NULL;

-- Clients actifs
CREATE INDEX idx_client_statut ON client(statut)
  WHERE deleted_at IS NULL;

-- Score courant d'un client (dernière évaluation)
CREATE INDEX idx_score_client_date ON score_risque(client_id, created_at DESC);

-- Documents arrivant à expiration (relances automatiques)
CREATE INDEX idx_document_expires ON document(expires_at)
  WHERE expires_at IS NOT NULL;

-- Obligations en retard
CREATE INDEX idx_obligation_client_statut ON obligation(client_id, statut, date_echeance);

-- Audit trail par ressource
CREATE INDEX idx_audit_ressource ON audit_log(ressource, ressource_id);

-- Recherche par SIRET
CREATE INDEX idx_client_siret ON client(siret) WHERE siret IS NOT NULL;
CREATE INDEX idx_prospect_siret ON prospect(siret) WHERE siret IS NOT NULL;

-- Opérations sensibles non traitées
CREATE INDEX idx_operation_statut ON operation_sensible(client_id, statut)
  WHERE statut IN ('SIGNALEE', 'EN_ANALYSE');
```

---

## 7. Entités TypeORM

### utilisateur.entity.ts
```typescript
@Entity()
export class Utilisateur {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column() prenom: string;
  @Column() nom: string;
  @Column({ unique: true }) email: string;
  @Column() password: string;
  @Column({ type: 'enum', enum: Role }) role: Role;
  @Column({ default: true }) actif: boolean;
  @CreateDateColumn() createdAt: Date;
  @DeleteDateColumn() deletedAt: Date | null;
}
```

### prospect.entity.ts
```typescript
@Entity()
export class Prospect {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ unique: true }) ref: string;
  @Column({ length: 14, nullable: true }) siret: string | null;
  @Column() nom: string;
  @Column({ nullable: true }) email: string | null;
  @Column({ type: 'enum', enum: TypeEntite }) typeEntite: TypeEntite;
  @Column({ type: 'enum', enum: StatutKanban, default: StatutKanban.PRISE_CONTACT })
  statutKanban: StatutKanban;
  @Column({ nullable: true, type: 'text' }) motifRefus: string | null;
  @Column({ nullable: true, type: 'decimal', precision: 15, scale: 2 })
  chiffreAffaires: number | null;
  @Column({ nullable: true }) pays: string;

  @ManyToOne(() => Utilisateur) createdBy: Utilisateur;
  @ManyToOne(() => Utilisateur, { nullable: true }) assignedTo: Utilisateur | null;

  @OneToOne(() => QuestionnaireAcceptation, q => q.prospect, { nullable: true })
  questionnaire: QuestionnaireAcceptation | null;

  @OneToOne(() => Client, c => c.prospect, { nullable: true })
  client: Client | null;

  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
  @DeleteDateColumn() deletedAt: Date | null;
}
```

### client.entity.ts
```typescript
@Entity()
export class Client {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ unique: true }) ref: string;
  @Column({ length: 14, nullable: true }) siret: string | null;
  @Column({ length: 9, nullable: true }) siren: string | null;
  @Column() raisonSociale: string;
  @Column({ type: 'enum', enum: TypeEntite }) typeEntite: TypeEntite;
  @Column({ nullable: true }) formeJuridique: string | null;
  @Column({ nullable: true }) codeNaf: string | null;
  @Column({ nullable: true }) activitePrincipale: string | null;
  @Column({ type: 'date', nullable: true }) dateCreationEntreprise: Date | null;
  @Column({ nullable: true, type: 'text' }) adresseSiege: string | null;
  @Column({ nullable: true }) ville: string | null;
  @Column({ nullable: true }) codePostal: string | null;
  @Column({ default: 'France' }) pays: string;
  @Column({ nullable: true, type: 'decimal', precision: 15, scale: 2 })
  chiffreAffaires: number | null;
  @Column({ nullable: true, type: 'integer' }) effectif: number | null;
  @Column({ nullable: true, type: 'text' }) natureMission: string | null;
  @Column({ type: 'enum', enum: StatutClient, default: StatutClient.ACTIF })
  statut: StatutClient;
  @Column({ nullable: true }) sireneUpdatedAt: Date | null;

  // Champs KYC fusionnés
  @Column({ type: 'enum', enum: StatutKyc, default: StatutKyc.INCOMPLET })
  kycStatut: StatutKyc;
  @Column({ default: false }) ppe: boolean;
  @Column({ nullable: true, type: 'text' }) ppeDetail: string | null;
  @Column({ default: false }) uboSaisi: boolean;
  @Column({ type: 'enum', enum: ScreeningStatut, default: ScreeningStatut.NON_EFFECTUE })
  screeningStatut: ScreeningStatut;
  @Column({ nullable: true }) screeningDate: Date | null;
  @Column({ nullable: true }) kycCompletedAt: Date | null;
  @ManyToOne(() => Utilisateur, { nullable: true }) kycValidatedBy: Utilisateur | null;

  @OneToOne(() => Prospect, p => p.client, { nullable: true })
  @JoinColumn() prospect: Prospect | null;

  @OneToMany(() => BeneficiaireEffectif, b => b.client) beneficiaires: BeneficiaireEffectif[];
  @OneToMany(() => Contact, c => c.client) contacts: Contact[];
  @OneToMany(() => Document, d => d.client) documents: Document[];
  @OneToMany(() => ScoreRisque, s => s.client) scores: ScoreRisque[];
  @OneToMany(() => Mission, m => m.client) missions: Mission[];
  @OneToMany(() => PlanningEtape, p => p.client) planningEtapes: PlanningEtape[];
  @OneToMany(() => Obligation, o => o.client) obligations: Obligation[];
  @OneToMany(() => OperationSensible, o => o.client) operationsSensibles: OperationSensible[];

  @ManyToOne(() => Utilisateur) createdBy: Utilisateur;
  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
  @DeleteDateColumn() deletedAt: Date | null;
}
```

### score_risque.entity.ts
```typescript
@Entity()
export class ScoreRisque {
  @PrimaryGeneratedColumn('uuid') id: string;
  @ManyToOne(() => Client, c => c.scores) client: Client;
  @Column({ type: 'integer' }) score: number;
  @Column({ type: 'enum', enum: NiveauRisque }) niveau: NiveauRisque;
  @Column({ type: 'jsonb' }) reponses: Record<string, unknown>;
  @ManyToOne(() => Utilisateur) calculatedBy: Utilisateur;
  @CreateDateColumn() createdAt: Date;
  // Aucun updatedAt : cette entité est en INSERT-ONLY (historique immuable)
}
```

### operation_sensible.entity.ts
```typescript
@Entity()
export class OperationSensible {
  @PrimaryGeneratedColumn('uuid') id: string;
  @ManyToOne(() => Client, c => c.operationsSensibles) client: Client;
  @Column({ type: 'enum', enum: TypeOperationSensible }) type: TypeOperationSensible;
  @Column({ type: 'text' }) description: string;
  @Column({ nullable: true, type: 'decimal', precision: 15, scale: 2 }) montant: number | null;
  @Column({ nullable: true, length: 3 }) devise: string | null;
  @Column({
    type: 'enum',
    enum: StatutOperationSensible,
    default: StatutOperationSensible.SIGNALEE,
  })
  statut: StatutOperationSensible;
  @Column({ nullable: true }) tracfinDate: Date | null;
  @ManyToOne(() => Utilisateur, { nullable: true }) validatedBy: Utilisateur | null;
  @Column({ nullable: true }) validatedAt: Date | null;
  @ManyToOne(() => Utilisateur) signaleBy: Utilisateur;
  @CreateDateColumn() createdAt: Date;
}
```

---

## 8. Enums TypeScript

```typescript
export enum Role {
  COLLABORATEUR    = 'COLLABORATEUR',
  RESPONSABLE      = 'RESPONSABLE',
  EXPERT_COMPTABLE = 'EXPERT_COMPTABLE',
  ADMIN            = 'ADMIN',
}

export enum TypeEntite {
  PERSONNE_PHYSIQUE = 'PERSONNE_PHYSIQUE',
  PERSONNE_MORALE   = 'PERSONNE_MORALE',
}

export enum StatutKanban {
  PRISE_CONTACT = 'PRISE_CONTACT',
  DECOUVERTE    = 'DECOUVERTE',
  OPPORTUNITE   = 'OPPORTUNITE',
  LAB           = 'LAB',
  PREPARATION   = 'PREPARATION',
  CONVERTI      = 'CONVERTI',
  REFUSE        = 'REFUSE',
}

export enum StatutClient {
  ACTIF    = 'ACTIF',
  INACTIF  = 'INACTIF',
  RESILIE  = 'RESILIE',
}

export enum StatutKyc {
  INCOMPLET = 'INCOMPLET',
  COMPLET   = 'COMPLET',
  VALIDE    = 'VALIDE',
  EXPIRE    = 'EXPIRE',
}

export enum ScreeningStatut {
  NON_EFFECTUE = 'NON_EFFECTUE',
  OK           = 'OK',
  ALERTE       = 'ALERTE',
}

export enum NiveauRisque {
  FAIBLE = 'FAIBLE',
  MOYEN  = 'MOYEN',
  ELEVE  = 'ELEVE',
}

export enum TypeDocument {
  PIECE_IDENTITE        = 'PIECE_IDENTITE',
  JUSTIFICATIF_DOMICILE = 'JUSTIFICATIF_DOMICILE',
  KBIS                  = 'KBIS',
  STATUTS               = 'STATUTS',
  LISTE_UBO             = 'LISTE_UBO',
  ATTESTATION_PPE       = 'ATTESTATION_PPE',
  JUSTIFICATIF_FONDS    = 'JUSTIFICATIF_FONDS',
  LETTRE_MISSION        = 'LETTRE_MISSION',
  RAPPORT               = 'RAPPORT',
  ANNEXE                = 'ANNEXE',
  AUTRE                 = 'AUTRE',
}

export enum TypeMission {
  COMPTABILITE = 'COMPTABILITE',
  AUDIT        = 'AUDIT',
  CONSEIL      = 'CONSEIL',
  JURIDIQUE    = 'JURIDIQUE',
  AUTRE        = 'AUTRE',
}

export enum StatutMission {
  EN_COURS  = 'EN_COURS',
  SUSPENDUE = 'SUSPENDUE',
  TERMINEE  = 'TERMINEE',
  RESILIEE  = 'RESILIEE',
}

export enum TypeObligation {
  KYC_VERIFICATION  = 'KYC_VERIFICATION',
  EVALUATION_RISQUE = 'EVALUATION_RISQUE',
  MISE_A_JOUR_DOCS  = 'MISE_A_JOUR_DOCS',
  VALIDATION_RELATION = 'VALIDATION_RELATION',
  LETTRE_MISSION    = 'LETTRE_MISSION',
}

export enum StatutObligation {
  A_FAIRE   = 'A_FAIRE',
  FAIT      = 'FAIT',
  EN_RETARD = 'EN_RETARD',
  EXPIRE    = 'EXPIRE',
}

export enum TypeOperationSensible {
  SANS_JUSTIFICATION  = 'SANS_JUSTIFICATION',
  COMPLEXE            = 'COMPLEXE',
  SANS_OBJET_LICITE   = 'SANS_OBJET_LICITE',
  INHABITUELLE        = 'INHABITUELLE',
  ECONOMIE_VIRTUELLE  = 'ECONOMIE_VIRTUELLE',
  ESPECES             = 'ESPECES',
  AUTRE               = 'AUTRE',
}

export enum StatutOperationSensible {
  SIGNALEE         = 'SIGNALEE',
  EN_ANALYSE       = 'EN_ANALYSE',
  CLASSEE          = 'CLASSEE',
  TRACFIN_DECLARE  = 'TRACFIN_DECLARE',
}

export enum TypeContact {
  INTERVENANT         = 'INTERVENANT',
  AVOCAT              = 'AVOCAT',
  COMMISSAIRE_COMPTES = 'COMMISSAIRE_COMPTES',
  NOTAIRE             = 'NOTAIRE',
  AUTRE               = 'AUTRE',
}
```

---

## 9. Ordre des migrations

```
1.  CreateUtilisateur
2.  CreateProspect                   ← FK → utilisateur
3.  CreateQuestionnaireAcceptation   ← FK → prospect, utilisateur
4.  CreateClient                     ← FK → prospect, utilisateur (kyc_validated_by)
5.  CreateBeneficiaireEffectif       ← FK → client
6.  CreateContact                    ← FK → client
7.  CreateMission                    ← FK → client, utilisateur
8.  CreateDocument                   ← FK → client, mission, utilisateur
9.  CreateLettreMission              ← FK → mission, utilisateur
10. CreateScoreRisque                ← FK → client, utilisateur
11. CreatePlanningEtape              ← FK → client, utilisateur
12. CreateObligation                 ← FK → client
13. CreateOperationSensible          ← FK → client, utilisateur
14. CreateAuditLog                   ← FK → utilisateur
```

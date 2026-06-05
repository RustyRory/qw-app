# 6.4 Conception de la base de données

La base de données de QW-app est conçue selon la méthodologie **Merise**, en trois étapes successives : MCD → MLD → MPD. Le SGBD retenu est **PostgreSQL 16**, accédé via **TypeORM** (ORM TypeScript).

> **Outils recommandés :** [Looping](https://www.looping-mcd.fr/) · [JMerise](https://www.jfreesoft.com/JMerise/index.php) · [MySQL Workbench](https://www.mysql.com/products/workbench/)

---

## Étape 1 — Dictionnaire des données

Le dictionnaire recense l'ensemble des informations à stocker dans la base de données.

| Table | Champ | Description |
|---|---|---|
| users | id | Identifiant unique (UUID) |
| users | email | Adresse e-mail de l'utilisateur (unique) |
| users | password_hash | Mot de passe haché (bcrypt) |
| users | role | Rôle RBAC : collaborateur · responsable · expert-comptable · admin |
| users | prenom | Prénom de l'utilisateur |
| users | nom | Nom de famille de l'utilisateur |
| users | is_active | Compte actif ou désactivé (booléen) |
| users | last_login_at | Date et heure de la dernière connexion |
| users | created_at | Date de création du compte |
| users | updated_at | Date de dernière modification |
| clients | id | Identifiant unique (UUID) |
| clients | reference | Référence dossier unique générée (ex : QW-2024-001) |
| clients | prenom | Prénom du client (personne physique) |
| clients | nom | Nom de famille du client |
| clients | raison_sociale | Raison sociale (personne morale, optionnel) |
| clients | email | Adresse e-mail du client |
| clients | telephone | Numéro de téléphone du client |
| clients | statut | Statut du dossier : en_cours · valide · rejete |
| clients | deleted_at | Date de suppression logique (soft delete, RGPD) |
| clients | created_at | Date de création du dossier |
| clients | updated_at | Date de dernière modification |
| clients | id_createur | Référence vers l'utilisateur ayant créé le dossier |
| clients | id_validateur | Référence vers l'utilisateur ayant validé (optionnel) |
| kyc | id | Identifiant unique (UUID) |
| kyc | nationalite | Nationalité du client |
| kyc | pays_residence | Pays de résidence du client |
| kyc | secteur_activite | Secteur d'activité professionnel |
| kyc | forme_juridique | Forme juridique (SA, SARL, SAS, auto-entrepreneur…) |
| kyc | est_pep | Personne Politiquement Exposée (booléen) |
| kyc | pays_haut_risque | Lien avec un pays à haut risque LCB-FT (booléen) |
| kyc | chiffre_affaires | Chiffre d'affaires annuel déclaré (optionnel) |
| kyc | created_at | Date de création des données KYC |
| kyc | updated_at | Date de dernière mise à jour |
| kyc | id_client | Référence vers le client (relation 1-1) |
| documents | id | Identifiant unique (UUID) |
| documents | nom_fichier | Nom original du fichier uploadé |
| documents | chemin_stockage | Chemin de stockage sur serveur ou lien externe |
| documents | type_mime | Type MIME du fichier (application/pdf, image/jpeg…) |
| documents | taille | Taille du fichier en octets |
| documents | created_at | Date d'upload du document |
| documents | id_client | Référence vers le client associé |
| documents | id_utilisateur | Référence vers l'utilisateur ayant uploadé le fichier |
| risk_scores | id | Identifiant unique (UUID) |
| risk_scores | score | Score numérique calculé (0 à 100) |
| risk_scores | niveau | Niveau de risque : faible · moyen · eleve |
| risk_scores | details | Détail des critères de calcul (JSON) |
| risk_scores | calculated_at | Date et heure du calcul du score |
| risk_scores | id_client | Référence vers le client évalué |
| risk_scores | id_utilisateur | Référence vers l'utilisateur ayant déclenché le calcul |
| prospects | id | Identifiant unique (UUID) |
| prospects | prenom | Prénom du prospect (personne physique) |
| prospects | nom | Nom de famille du prospect |
| prospects | raison_sociale | Raison sociale (personne morale, optionnel) |
| prospects | email | Adresse e-mail du prospect |
| prospects | telephone | Numéro de téléphone du prospect |
| prospects | secteur_activite | Secteur d'activité (pré-qualification) |
| prospects | pays_residence | Pays de résidence (pré-qualification) |
| prospects | est_pep | Personne Politiquement Exposée (booléen, pré-qualification) |
| prospects | notes | Notes libres sur le prospect |
| prospects | statut | Statut : nouveau · en_analyse · converti · rejete |
| prospects | client_id | Référence vers le client créé lors de la conversion (nullable) |
| prospects | created_at | Date de création |
| prospects | updated_at | Date de dernière modification |
| prospects | id_createur | Référence vers l'utilisateur ayant créé le prospect |
| audit_logs | id | Identifiant unique (UUID) |
| audit_logs | action | Type d'action : CREATE · UPDATE · DELETE · READ · VALIDATE · LOGIN |
| audit_logs | entite_type | Type d'entité concernée (client, kyc, document…) |
| audit_logs | entite_id | Identifiant de l'entité concernée |
| audit_logs | details | Données avant/après modification (JSON) |
| audit_logs | created_at | Date et heure de l'action (horodatage) |
| audit_logs | id_utilisateur | Référence vers l'utilisateur ayant réalisé l'action |

---

## Étape 2 — MCD (Modèle Conceptuel de Données)

> Le schéma visuel du MCD est à réaliser avec **Looping** ou **JMerise** à partir des entités et associations ci-dessous.

### Entités

| Entité | Propriétés principales |
|---|---|
| **UTILISATEUR** | id, email, password_hash, role, prenom, nom, is_active, last_login_at |
| **CLIENT** | id, reference, prenom, nom, raison_sociale, email, telephone, statut, deleted_at |
| **KYC** | id, nationalite, pays_residence, secteur_activite, forme_juridique, est_pep, pays_haut_risque, chiffre_affaires |
| **DOCUMENT** | id, nom_fichier, chemin_stockage, type_mime, taille |
| **SCORE_RISQUE** | id, score, niveau, details, calculated_at |
| **PROSPECT** | id, prenom, nom, raison_sociale, email, telephone, secteur_activite, pays_residence, est_pep, notes, statut, client_id |
| **AUDIT_LOG** | id, action, entite_type, entite_id, details, created_at |

### Associations, liaisons et cardinalités

```
UTILISATEUR (1,n) ────── crée ────── (0,n) CLIENT
   Un utilisateur peut créer 0 ou plusieurs clients.
   Un client est créé par exactement 1 utilisateur.

UTILISATEUR (0,n) ──── valide ──── (0,1) CLIENT
   Un utilisateur peut valider 0 ou plusieurs dossiers.
   Un client peut être validé par au plus 1 utilisateur.

CLIENT (1,1) ──── possède ──── (1,1) KYC
   Un client possède exactement 1 fiche KYC.
   Une fiche KYC appartient à exactement 1 client.

CLIENT (1,n) ──── détient ──── (0,n) DOCUMENT
   Un client peut avoir 0 ou plusieurs documents.
   Un document est rattaché à exactement 1 client.

UTILISATEUR (1,n) ── uploade ── (0,n) DOCUMENT
   Un utilisateur peut uploader 0 ou plusieurs documents.
   Un document est uploadé par exactement 1 utilisateur.

CLIENT (1,n) ──── fait_lobjet ──── (0,n) SCORE_RISQUE
   Un client peut avoir 0 ou plusieurs scores (historique).
   Un score concerne exactement 1 client.

UTILISATEUR (1,n) ── calcule ── (0,n) SCORE_RISQUE
   Un utilisateur peut calculer 0 ou plusieurs scores.
   Un score est calculé par exactement 1 utilisateur.

UTILISATEUR (1,n) ──── genere ──── (0,n) AUDIT_LOG
   Un utilisateur peut générer 0 ou plusieurs entrées d'audit.
   Une entrée d'audit est générée par exactement 1 utilisateur.

UTILISATEUR (1,n) ──── cree ──── (0,n) PROSPECT
   Un utilisateur peut créer 0 ou plusieurs prospects.
   Un prospect est créé par exactement 1 utilisateur.

PROSPECT (0,1) ──── converti_en ──── (0,1) CLIENT
   Un prospect peut être converti en au plus 1 client.
   Un client peut avoir été issu de la conversion d'un prospect (optionnel).
```

---

## Étape 3 — MLD (Modèle Logique de Données)

Traduction du MCD en tables relationnelles. Les clés primaires sont en **MAJUSCULES**, les clés étrangères entre `[crochets]`.

```
UTILISATEUR (ID, email, password_hash, role, prenom, nom, is_active, last_login_at, created_at, updated_at)

CLIENT (ID, reference, prenom, nom, raison_sociale, email, telephone, statut, deleted_at, created_at, updated_at,
        [id_createur → UTILISATEUR.id], [id_validateur → UTILISATEUR.id])

KYC (ID, nationalite, pays_residence, secteur_activite, forme_juridique, est_pep, pays_haut_risque,
     chiffre_affaires, created_at, updated_at,
     [id_client → CLIENT.id])                    ← relation 1-1 (UNIQUE)

DOCUMENT (ID, nom_fichier, chemin_stockage, type_mime, taille, created_at,
          [id_client → CLIENT.id], [id_utilisateur → UTILISATEUR.id])

SCORE_RISQUE (ID, score, niveau, details, calculated_at,
              [id_client → CLIENT.id], [id_utilisateur → UTILISATEUR.id])

AUDIT_LOG (ID, action, entite_type, entite_id, details, created_at,
           [id_utilisateur → UTILISATEUR.id])

PROSPECT (ID, prenom, nom, raison_sociale, email, telephone, secteur_activite,
          pays_residence, est_pep, notes, statut, client_id, created_at, updated_at,
          [id_createur → UTILISATEUR.id])
          client_id est nullable — renseigné uniquement si statut = 'converti'
```

> **À retenir :** le MLD est encore indépendant du SGBD. La relation 1-1 entre CLIENT et KYC est matérialisée par une contrainte `UNIQUE` sur `kyc.id_client`. Le soft delete (RGPD, rétention 5 ans) est géré par le champ `deleted_at` sur CLIENT.

---

## Étape 4 — MPD (Modèle Physique de Données)

Implémentation concrète pour **PostgreSQL 16** avec TypeORM. Les types sont définis précisément, les contraintes d'intégrité et les index sont inclus.

### Types énumérés (PostgreSQL ENUM)

```sql
CREATE TYPE user_role AS ENUM (
    'collaborateur',
    'responsable',
    'expert-comptable',
    'admin'
);

CREATE TYPE client_statut AS ENUM (
    'en_cours',
    'valide',
    'rejete'
);

CREATE TYPE risk_niveau AS ENUM (
    'faible',
    'moyen',
    'eleve'
);

CREATE TYPE audit_action AS ENUM (
    'CREATE',
    'UPDATE',
    'DELETE',
    'READ',
    'VALIDATE',
    'LOGIN'
);

CREATE TYPE prospect_statut AS ENUM (
    'nouveau',
    'en_analyse',
    'converti',
    'rejete'
);
```

### Tables

```sql
-- ================================================================
-- UTILISATEURS
-- ================================================================
CREATE TABLE users (
    id            UUID          DEFAULT gen_random_uuid() PRIMARY KEY,
    email         VARCHAR(255)  NOT NULL UNIQUE,
    password_hash VARCHAR(255)  NOT NULL,
    role          user_role     NOT NULL DEFAULT 'collaborateur',
    prenom        VARCHAR(100)  NOT NULL,
    nom           VARCHAR(100)  NOT NULL,
    is_active     BOOLEAN       NOT NULL DEFAULT TRUE,
    last_login_at TIMESTAMPTZ,
    created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ================================================================
-- CLIENTS
-- ================================================================
CREATE TABLE clients (
    id             UUID          DEFAULT gen_random_uuid() PRIMARY KEY,
    reference      VARCHAR(50)   NOT NULL UNIQUE,
    prenom         VARCHAR(100)  NOT NULL,
    nom            VARCHAR(100)  NOT NULL,
    raison_sociale VARCHAR(200),
    email          VARCHAR(255),
    telephone      VARCHAR(20),
    statut         client_statut NOT NULL DEFAULT 'en_cours',
    deleted_at     TIMESTAMPTZ,                        -- soft delete RGPD
    created_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    id_createur    UUID          NOT NULL,
    id_validateur  UUID,
    FOREIGN KEY (id_createur)   REFERENCES users(id),
    FOREIGN KEY (id_validateur) REFERENCES users(id)
);

-- ================================================================
-- KYC (relation 1-1 avec clients)
-- ================================================================
CREATE TABLE kyc (
    id               UUID          DEFAULT gen_random_uuid() PRIMARY KEY,
    nationalite      VARCHAR(100),
    pays_residence   VARCHAR(100),
    secteur_activite VARCHAR(200),
    forme_juridique  VARCHAR(100),
    est_pep          BOOLEAN       NOT NULL DEFAULT FALSE,
    pays_haut_risque BOOLEAN       NOT NULL DEFAULT FALSE,
    chiffre_affaires DECIMAL(15,2),
    created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    id_client        UUID          NOT NULL UNIQUE,     -- UNIQUE → relation 1-1
    FOREIGN KEY (id_client) REFERENCES clients(id)
);

-- ================================================================
-- DOCUMENTS
-- ================================================================
CREATE TABLE documents (
    id               UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
    nom_fichier      VARCHAR(255) NOT NULL,
    chemin_stockage  VARCHAR(500) NOT NULL,
    type_mime        VARCHAR(100) NOT NULL,
    taille           BIGINT       NOT NULL,             -- taille en octets
    created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    id_client        UUID         NOT NULL,
    id_utilisateur   UUID         NOT NULL,
    FOREIGN KEY (id_client)      REFERENCES clients(id),
    FOREIGN KEY (id_utilisateur) REFERENCES users(id)
);

-- ================================================================
-- SCORES DE RISQUE (historique)
-- ================================================================
CREATE TABLE risk_scores (
    id             UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
    score          SMALLINT    NOT NULL CHECK (score BETWEEN 0 AND 100),
    niveau         risk_niveau NOT NULL,
    details        JSONB,                               -- critères détaillés du calcul
    calculated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    id_client      UUID        NOT NULL,
    id_utilisateur UUID        NOT NULL,
    FOREIGN KEY (id_client)      REFERENCES clients(id),
    FOREIGN KEY (id_utilisateur) REFERENCES users(id)
);

-- ================================================================
-- PROSPECTS (pré-qualification — suppression hard autorisée)
-- ================================================================
CREATE TABLE prospects (
    id               UUID             DEFAULT gen_random_uuid() PRIMARY KEY,
    prenom           VARCHAR(100)     NOT NULL,
    nom              VARCHAR(100)     NOT NULL,
    raison_sociale   VARCHAR(200),
    email            VARCHAR(255),
    telephone        VARCHAR(20),
    secteur_activite VARCHAR(200),
    pays_residence   VARCHAR(100),
    est_pep          BOOLEAN          NOT NULL DEFAULT FALSE,
    notes            TEXT,
    statut           prospect_statut  NOT NULL DEFAULT 'nouveau',
    client_id        UUID,                                        -- renseigné si converti
    created_at       TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
    id_createur      UUID             NOT NULL,
    FOREIGN KEY (id_createur) REFERENCES users(id)
    -- Pas de FK sur client_id : le client peut exister indépendamment
);

-- ================================================================
-- AUDIT LOGS (traçabilité RGPD — conservation 5 ans)
-- ================================================================
CREATE TABLE audit_logs (
    id             UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
    action         audit_action NOT NULL,
    entite_type    VARCHAR(50)  NOT NULL,               -- 'client', 'kyc', 'document'…
    entite_id      UUID         NOT NULL,
    details        JSONB,                               -- état avant/après modification
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    id_utilisateur UUID         NOT NULL,
    FOREIGN KEY (id_utilisateur) REFERENCES users(id)
);
```

### Index

```sql
-- Clients : filtrage par statut, soft delete et créateur
CREATE INDEX idx_clients_statut      ON clients(statut);
CREATE INDEX idx_clients_deleted_at  ON clients(deleted_at);
CREATE INDEX idx_clients_id_createur ON clients(id_createur);

-- Scores : recherche par client
CREATE INDEX idx_risk_scores_id_client ON risk_scores(id_client);

-- Audit : recherche par utilisateur, entité et date (requêtes fréquentes)
CREATE INDEX idx_audit_logs_id_utilisateur ON audit_logs(id_utilisateur);
CREATE INDEX idx_audit_logs_entite         ON audit_logs(entite_type, entite_id);
CREATE INDEX idx_audit_logs_created_at     ON audit_logs(created_at DESC);

-- Documents : recherche par client
CREATE INDEX idx_documents_id_client ON documents(id_client);

-- Prospects : filtrage par statut et créateur
CREATE INDEX idx_prospects_statut      ON prospects(statut);
CREATE INDEX idx_prospects_id_createur ON prospects(id_createur);
```

### Vue d'ensemble des relations

```
users ──────────────────────────────────────────────────────────┐
  │ (1,n) crée                           │ (1,n) crée           │
  │                                      ▼ (0,n)                │ (1,n) génère
  ▼ (0,n)                            prospects                  ▼
clients ──(1,1)──► kyc                  │ (0,1) converti_en    audit_logs
  │ ◄──────────────────────────────────┘
  ├──(1,n)──► documents ◄──(0,n)── users
  │
  └──(1,n)──► risk_scores ◄──(0,n)── users
```

> **Note TypeORM :** les entités TypeScript (`@Entity`, `@Column`, `@OneToOne`, `@OneToMany`, `@ManyToOne`) génèrent ce schéma automatiquement via les migrations. Le champ `deleted_at` est géré par le décorateur `@DeleteDateColumn()` (soft delete natif TypeORM).

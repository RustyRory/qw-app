# Modélisation de la base de données

La base de données de QW-app est conçue selon la méthodologie **Merise** (MCD → MLD), pour un total de **14 entités**. Le SGBD retenu est **PostgreSQL 16**, accédé via **TypeORM** (ORM TypeScript). Les documents (pièces d'identité, Kbis, lettres de mission…) ne sont pas stockés en base mais chez **OVHcloud Object Storage** (S3-compatible, prestataire externe — voir [security.md](./security.md)) — seules leurs métadonnées sont persistées dans la table `document`.

---

## 1. Décisions de conception

### 1.1 KYC fusionné dans Client

La fiche KYC (statut, PPE, screening…) est en relation 1-1 stricte avec le client. Une table séparée n'apporterait que de la complexité : JOIN systématique, deux entités à maintenir, cascade à gérer. Les champs KYC sont donc directement dans la table `client`.

Ce qui reste **séparé** :
- `beneficiaire_effectif` → relation 0-N (un client peut avoir plusieurs bénéficiaires effectifs)
- `document` → relation 0-N (stockage S3, types variés)

### 1.2 UUID pour toutes les clés primaires

Les entiers auto-incrémentés permettent l'énumération des ressources (`GET /clients/42`). L'UUID supprime ce vecteur d'attaque.

### 1.3 Soft delete sur `client` et `utilisateur`

L'obligation LCB-FT impose une **rétention de 5 ans** après la fin de la relation (art. L.561-12 CMF). La suppression physique immédiate est une violation réglementaire.

### 1.4 `score_risque` est une table avec historique

Chaque évaluation ARPEC crée une **nouvelle ligne horodatée**. Cela permet de tracer l'évolution du risque dans le temps (obligation de surveillance continue, art. L.561-6 CMF). Le score courant = la ligne avec le `created_at` le plus récent pour un `client_id` donné. Aucun `UPDATE` n'est autorisé sur cette table (historique immuable).

### 1.5 `reponses` en JSONB

Les réponses du questionnaire d'acceptation (`questionnaire_acceptation.reponses`) et le détail d'un score ARPEC (`score_risque.reponses`) sont stockés en JSONB PostgreSQL. Avantages : le schéma peut évoluer sans migration, les données restent queryables, et la structure est auto-documentée.

### 1.6 `audit_log` en INSERT-ONLY

Aucun `UPDATE` ni `DELETE` n'est autorisé sur la table d'audit — c'est la garantie de traçabilité exigée par la réglementation.

---

## 2. Les 14 entités

| # | Entité | Description |
|---|--------|-------------|
| 1 | **Utilisateur** | Compte interne (collaborateur, responsable, expert-comptable, admin) |
| 2 | **Prospect** | Contact commercial en cours d'évaluation (pipeline Kanban) |
| 3 | **QuestionnaireAcceptation** | Décision formelle d'entrée en relation d'affaires (LAB) |
| 4 | **Client** | Relation d'affaires acceptée — contient les champs KYC fusionnés |
| 5 | **BeneficiaireEffectif** | UBO lié à un client (>25 % du capital ou contrôle effectif) |
| 6 | **Contact** | Tiers liés au client (avocat, commissaire aux comptes, notaire…) |
| 7 | **Document** | Métadonnées d'un fichier stocké chez OVHcloud Object Storage (pièce d'identité, Kbis, annexe…) |
| 8 | **ScoreRisque** | Évaluation de risque ARPEC horodatée — une ligne par évaluation |
| 9 | **Mission** | Engagement contractuel cabinet ↔ client |
| 10 | **LettreMission** | Document signé lié à une mission (versionnée) |
| 11 | **PlanningEtape** | Diligence ou tâche planifiée sur un dossier |
| 12 | **Obligation** | Obligation réglementaire LCB-FT à satisfaire |
| 13 | **OperationSensible** | Opération atypique signalée pour analyse (potentiellement Tracfin) |
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

### 3.2 Vue d'ensemble des relations

```
Utilisateur
    ├── crée ──────────────► Prospect ──── possède (0,1) ──► QuestionnaireAcceptation
    │                            │
    │                    converti_en (0,1)
    │                            │
    ├── crée ──────────────► Client  ◄────── prospect_id? (UNIQUE)
    │                          │
    │         ┌────────────────┼────────────────────────────┐
    │         │                │                            │
    │         ▼                ▼                            ▼
    │   BeneficiaireEffectif  ScoreRisque                Mission
    │                          (historique)                  │
    │                                                  LettreMission
    │         │                │                            │
    │         ▼                ▼                            ▼
    │       Contact         Document ◄─────────── mission_id? (nullable)
    │
    │       PlanningEtape
    │       Obligation
    │       OperationSensible
    │
    └── logue ─────────────► AuditLog
```

---

## 4. MLD — Modèle Logique de Données

Les clés primaires sont en **MAJUSCULES**, les clés étrangères entre `[crochets]`. Le `?` indique un champ nullable.

```
UTILISATEUR (ID, prenom, nom, email UNIQUE, password_hash, role, actif, created_at, deleted_at?)

PROSPECT (ID, ref UNIQUE, siret?, nom, email?, telephone?, type_entite, statut_kanban,
          motif_refus?, activite?, code_naf?, adresse?, ville?, code_postal?, pays,
          chiffre_affaires?, effectif?, created_at, updated_at, deleted_at?,
          [id_createur → UTILISATEUR.id], [id_assigned → UTILISATEUR.id])

QUESTIONNAIRE_ACCEPTATION (ID, statut, reponses, motif_refus?, validated_at?, created_at,
          [id_prospect → PROSPECT.id] UNIQUE,
          [id_validated_by → UTILISATEUR.id], [id_createur → UTILISATEUR.id])

CLIENT (ID, ref UNIQUE, siret?, siren?, raison_sociale, type_entite, forme_juridique?,
        code_naf?, activite_principale?, date_creation_entreprise?, adresse_siege?,
        ville?, code_postal?, pays, chiffre_affaires?, effectif?, nature_mission?,
        statut, sirene_updated_at?,
        kyc_statut, ppe, ppe_detail?, ubo_saisi, screening_statut, screening_date?,
        kyc_completed_at?, created_at, updated_at, deleted_at?,
        [id_prospect → PROSPECT.id]? UNIQUE,
        [id_kyc_validator → UTILISATEUR.id]?, [id_createur → UTILISATEUR.id])

BENEFICIAIRE_EFFECTIF (ID, prenom?, nom, date_naissance?, nationalite?, adresse?,
        pourcentage_detention, ppe, created_at,
        [id_client → CLIENT.id])

CONTACT (ID, prenom?, nom, email?, telephone?, type, role_detail?, created_at,
        [id_client → CLIENT.id])

DOCUMENT (ID, type, nom, mime_type, taille_octets, s3_key UNIQUE, expires_at?, relance_at?,
        created_at,
        [id_client → CLIENT.id], [id_mission → MISSION.id]?, [id_uploaded_by → UTILISATEUR.id])

SCORE_RISQUE (ID, score CHECK(0-150), niveau, reponses JSONB, created_at,
        [id_client → CLIENT.id], [id_calculated_by → UTILISATEUR.id])
        ← INSERT-ONLY, score courant = MAX(created_at) par client

MISSION (ID, type, description?, statut, date_debut, date_fin?, honoraires?,
        created_at, updated_at,
        [id_client → CLIENT.id], [id_createur → UTILISATEUR.id])

LETTRE_MISSION (ID, version, contenu JSONB, signee_par_expert, signee_at?, s3_key?, created_at,
        [id_mission → MISSION.id], [id_signataire → UTILISATEUR.id]?)

PLANNING_ETAPE (ID, titre, description?, type, statut, date_echeance?, completed_at?,
        created_at,
        [id_client → CLIENT.id], [id_completed_by → UTILISATEUR.id]?,
        [id_assigned_to → UTILISATEUR.id]?, [id_createur → UTILISATEUR.id])

OBLIGATION (ID, type, statut, date_echeance?, completed_at?, created_at, updated_at,
        [id_client → CLIENT.id])

OPERATION_SENSIBLE (ID, type, description, montant?, devise?, statut, tracfin_date?,
        validated_at?, created_at,
        [id_client → CLIENT.id], [id_validated_by → UTILISATEUR.id]?,
        [id_signale_by → UTILISATEUR.id])

AUDIT_LOG (ID, action, ressource, ressource_id, details JSONB?, ip_address?, created_at,
        [id_utilisateur → UTILISATEUR.id])
        ← INSERT-ONLY, aucun UPDATE/DELETE
```

### 4.1 Enums

| Enum | Valeurs |
|---|---|
| `Role` | `COLLABORATEUR`, `RESPONSABLE`, `EXPERT_COMPTABLE`, `ADMIN` |
| `TypeEntite` | `PERSONNE_PHYSIQUE`, `PERSONNE_MORALE` |
| `StatutKanban` | `PRISE_CONTACT`, `DECOUVERTE`, `OPPORTUNITE`, `LAB`, `PREPARATION`, `CONVERTI`, `REFUSE` |
| `StatutQuestionnaire` | `EN_COURS`, `VALIDE`, `REFUSE` |
| `StatutClient` | `ACTIF`, `INACTIF`, `RESILIE` |
| `StatutKyc` | `INCOMPLET`, `COMPLET`, `VALIDE`, `EXPIRE` |
| `ScreeningStatut` | `NON_EFFECTUE`, `OK`, `ALERTE` |
| `NiveauRisque` | `FAIBLE`, `MOYEN`, `ELEVE` |
| `TypeDocument` | `PIECE_IDENTITE`, `JUSTIFICATIF_DOMICILE`, `KBIS`, `STATUTS`, `LISTE_UBO`, `ATTESTATION_PPE`, `JUSTIFICATIF_FONDS`, `LETTRE_MISSION`, `RAPPORT`, `ANNEXE`, `AUTRE` |
| `TypeMission` | `COMPTABILITE`, `AUDIT`, `CONSEIL`, `JURIDIQUE`, `AUTRE` |
| `StatutMission` | `EN_COURS`, `SUSPENDUE`, `TERMINEE`, `RESILIEE` |
| `TypeObligation` | `KYC_VERIFICATION`, `EVALUATION_RISQUE`, `MISE_A_JOUR_DOCS`, `VALIDATION_RELATION`, `LETTRE_MISSION` |
| `StatutObligation` | `A_FAIRE`, `FAIT`, `EN_RETARD`, `EXPIRE` |
| `TypeOperationSensible` | `SANS_JUSTIFICATION`, `COMPLEXE`, `SANS_OBJET_LICITE`, `INHABITUELLE`, `ECONOMIE_VIRTUELLE`, `ESPECES`, `AUTRE` |
| `StatutOperationSensible` | `SIGNALEE`, `EN_ANALYSE`, `CLASSEE`, `TRACFIN_DECLARE` |
| `TypeContact` | `INTERVENANT`, `AVOCAT`, `COMMISSAIRE_COMPTES`, `NOTAIRE`, `AUTRE` |
| `AuditAction` | `CREATE`, `UPDATE`, `DELETE`, `READ`, `VALIDATE`, `LOGIN` |

---

## 5. Index recommandés

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

## 6. Ordre des migrations

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

> **Note TypeORM :** les entités TypeScript (`@Entity`, `@Column`, `@OneToOne`, `@OneToMany`, `@ManyToOne`) génèrent ce schéma via les migrations. Le champ `deletedAt` est géré par `@DeleteDateColumn()` (soft delete natif). Voir `docs/autre/workflow-backend.md` pour le code complet des entités et `docs/autre/modelisation-bdd.md` pour le détail champ par champ.

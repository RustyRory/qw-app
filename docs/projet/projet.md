# Projet — QW-App LCB-FT

> Application web de conformité anti-blanchiment (LCB-FT) pour cabinets d'experts-comptables.
> Inspirée de la solution SaaS Kanta, développée pour le Cabinet QW.

---

## 1. Contexte et objectifs

### 1.1 Contexte métier

Les cabinets d'expertise comptable sont soumis à des obligations légales strictes en matière de **Lutte contre le Blanchiment de Capitaux et le Financement du Terrorisme (LCB-FT)**, issues notamment de la directive européenne AMLD5 et de l'ordonnance n°2016-1635.

Ces obligations se déclinent en quatre axes :

| Obligation | Description |
|-----------|-------------|
| **Identification** | Vérifier l'identité du client (KYC) avant toute entrée en relation |
| **Évaluation du risque** | Classer chaque client selon son niveau de risque LCB-FT |
| **Surveillance continue** | Suivre l'évolution du profil de risque pendant la relation |
| **Déclaration** | Signaler les opérations suspectes à Tracfin |

Aujourd'hui, le Cabinet QW gère ces obligations via des fichiers Excel, emails et documents Drive. Cette situation entraîne : absence de traçabilité, données sensibles non protégées, processus non standardisés, et risque de non-conformité réglementaire.

### 1.2 Objectifs de l'application

**Objectif principal :** Centraliser, sécuriser et tracer la gestion de la conformité LCB-FT dans un outil unique.

**Objectifs secondaires :**
- Standardiser les processus d'entrée en relation (prospect → client)
- Automatiser les rappels liés aux documents expirés et obligations réglementaires
- Produire les documents réglementaires (lettres de mission, rapports)
- Intégrer des sources de données officielles (SIRET, listes de sanctions)

### 1.3 Périmètre

**Dans le périmètre MVP :**
- Gestion du pipeline prospect (Kanban)
- Dossier client complet (KYC, documents, contacts)
- Évaluation et cartographie des risques
- Questionnaire d'acceptation (prospect → client)
- Gestion des missions et lettres de mission
- Tableau des obligations réglementaires
- Planning et historique des actions
- Rapports exportables

**Hors périmètre MVP :**
- Intégration Pennylane (synchronisation automatique non possible)
- Module Arpec (outil tiers, intégration différée)
- Application mobile native
- Déclaration automatique à Tracfin
- Module de facturation

---

## 2. Acteurs et rôles

### 2.1 Identification des acteurs

| Acteur | Type | Description |
|--------|------|-------------|
| **Collaborateur** | Interne | Crée et gère les dossiers prospects/clients |
| **Responsable** | Interne | Valide les dossiers, supervise le portefeuille |
| **Expert-comptable** | Interne | Signe les lettres de mission, consulte les rapports |
| **Administrateur** | Interne | Gère les comptes utilisateurs, paramétrage global |
| **Client** | Externe | Destinataire des documents (pas d'accès à l'application) |

### 2.2 Matrice des droits (RBAC)

| Action | Collaborateur | Responsable | Expert-comptable | Administrateur |
|--------|:-------------:|:-----------:|:----------------:|:--------------:|
| Créer un prospect | ✅ | ✅ | ✅ | ✅ |
| Gérer le pipeline Kanban | ✅ | ✅ | ✅ | ✅ |
| Assigner un prospect à un collaborateur | ✅ | ✅ | ❌ | ✅ |
| Saisir le KYC | ✅ | ✅ | ✅ | ✅ |
| Valider le questionnaire d'acceptation | ❌ | ✅ | ✅ | ✅ |
| Convertir prospect → client | ❌ | ✅ | ✅ | ✅ |
| Signer une lettre de mission | ❌ | ❌ | ✅ | ✅ |
| Exporter un rapport | ❌ | ✅ | ✅ | ✅ |
| Déclarer une opération sensible | ✅ | ✅ | ✅ | ✅ |
| Valider la relation d'affaire | ❌ | ❌ | ✅ | ✅ |
| Gérer les utilisateurs | ❌ | ❌ | ❌ | ✅ |
| Supprimer un dossier (soft delete) | ❌ | ❌ | ❌ | ✅ |

> Les 4 rôles sont implémentés en base sous forme d'enum `Role` (`COLLABORATEUR`, `RESPONSABLE`, `EXPERT_COMPTABLE`, `ADMIN`). Voir [security.md](./security.md) pour le détail de l'application de ces droits côté backend/frontend.

---

## 3. Modules fonctionnels

L'application est découpée en 12 modules métier. Le détail complet (user stories, règles métier, zonings d'écran) est conservé dans `docs/mvp/cahier-des-charges.md` et `docs/mvp/workflow-frontend.md` ; ce tableau en donne la vue de synthèse utilisée pour le pilotage du projet.

| # | Module | Description | Réf. user stories |
|---|--------|-------------|--------------------|
| 1 | **Prospects** (pipeline commercial) | Suivi Kanban du cycle de vie d'un contact commercial jusqu'à conversion en client | US-P01 → US-P07 |
| 2 | **Dossier client** | Gestion complète des informations client (identification, localisation, situation économique, contacts) | US-C01 → US-C06 |
| 3 | **KYC** (Know Your Customer) | Collecte et vérification des pièces d'identité, bénéficiaires effectifs, statut PPE, screening sanctions | US-K01 → US-K06 |
| 4 | **Évaluation des risques** | Score de risque LCB-FT calculé **automatiquement** pour les clients comme pour les prospects — 9 critères pondérés du cahier des charges, normalisés en %, /100. Aucune saisie manuelle : les clients sont scorés depuis leurs données réelles (PPE, screening, bénéficiaires effectifs, CA), les prospects depuis leur questionnaire d'acceptation. Cartographie du portefeuille. | US-R01 → US-R05 |
| 5 | **Questionnaire d'acceptation (LAB)** | Validation formelle de l'entrée en relation — 61 questions réparties en 10 sections, contresignature si risque élevé | US-A01 → US-A07 |
| 6 | **Missions et lettres de mission** | Gestion des lettres de mission conformes Ordre des Experts-Comptables, signature électronique | US-M01 → US-M06 |
| 7 | **Planning et suivi** | Calendrier des diligences à réaliser sur chaque dossier | US-PL01 → US-PL05 |
| 8 | **Tableau des obligations** | Vue synthétique de l'état de conformité réglementaire par client | US-O01 → US-O03 |
| 9 | **Opérations sensibles** | Identification et suivi des opérations atypiques (potentiellement déclarables à Tracfin) | US-OS01 → US-OS03 |
| 10 | **Diligences et conseils KYC** | Recommandations contextuelles selon le niveau de risque | US-D01 → US-D02 |
| 11 | **Rapports** | Génération de documents de synthèse exportables (PDF) | US-RP01 → US-RP03 |
| 12 | **Documents et annexes** | Gestion documentaire centralisée par dossier, accès via URL pré-signée | US-DOC01 → US-DOC04 |

### Intégrations externes

| Intégration | Objectif | Déclenchement |
|---|---|---|
| **API Sirene (INSEE)** | Pré-remplir les données entreprise à partir du SIRET | Création du dossier + actualisation manuelle |
| **Listes de sanctions et PPE** (gel des avoirs, OFAC-UE, OFAC, ONU, LIMPI) | Détecter les correspondances sur client et bénéficiaires effectifs | Entrée en relation + mise à jour KYC + révision périodique |
| **Portail de l'Ordre des Experts-Comptables** | Modèles de lettres de mission conformes | Import documentaire (pas d'API) |
| **Pennylane** | Synchronisation des données client | Hors périmètre MVP — pas de mise à jour automatique possible via l'API |

---

## 4. Architecture et conception

Le détail technique est réparti dans les documents suivants :

| Document | Contenu |
|---|---|
| [architecture.md](./architecture.md) | Stack technique, structure des dossiers, communication frontend/backend |
| [database.md](./database.md) | Modélisation Merise (MCD/MLD), 14 entités, index, ordre des migrations |
| [security.md](./security.md) | RBAC, authentification, RGPD, sécurité documents |
| [workflow.md](./workflow.md) | Guide de développement, CI/CD, Git Flow, roadmap MVP |
| [deployment.md](./deployment.md) | Déploiement VPS, Docker, nginx |

---

## 5. Glossaire

| Terme | Définition |
|-------|-----------|
| **LCB-FT** | Lutte contre le Blanchiment de Capitaux et le Financement du Terrorisme |
| **KYC** | Know Your Customer — processus d'identification et de vérification du client |
| **PPE** | Personne Politiquement Exposée — client présentant un risque accru de corruption |
| **UBO** | Ultimate Beneficial Owner — bénéficiaire effectif (personne physique détenant >25% du capital) |
| **Tracfin** | Traitement du renseignement et action contre les circuits financiers clandestins |
| **GAFI** | Groupe d'Action Financière — organisme intergouvernemental fixant les standards LCB-FT |
| **SIRENE** | Système national d'identification et du répertoire des entreprises (INSEE) |
| **LIMPI** | Outil de screening LCB-FT dédié aux professions comptables et juridiques |
| **Gel des avoirs** | Mesure de blocage des fonds d'une personne ou entité sanctionnée |
| **Diligences** | Mesures de vérification et de surveillance imposées par la réglementation LCB-FT |
| **LAB** | Lettre d'Acceptation de la mission de Blanchiment — document préalable à l'entrée en relation |
| **ARPEC** | Ancienne méthode de scoring manuelle à 4 dimensions (caractéristiques client, activité/secteur, zone géographique, type de mission) — retirée, remplacée par le calcul automatique à 9 critères (voir Module 4) |
| **Audit trail** | Journal immuable de toutes les actions réalisées sur l'application |
| **Soft delete** | Suppression logique — l'enregistrement est marqué supprimé mais conservé en base |
| **Presigned URL** | URL temporaire donnant accès à un fichier S3 privé (durée limitée) |

# Changelog

## [0.3.0] - 2026-07-09

Migration du backend et du frontend vers le nouveau schéma de données LCB-FT défini dans `docs/mvp/` (KYC fusionné dans `Client`, pipeline prospect, questionnaire d'acceptation LAB, bénéficiaires effectifs, contacts, missions, lettres de mission, planning, obligations, opérations sensibles).

### Backend — reset et nouveau schéma (14 entités)

- Suppression du module `kyc/` (entité, dto, service, controller) et des anciennes migrations (`InitSchema`, `AddProspect`) — le KYC est désormais fusionné dans l'entité `Client`
- Création de `common/enums/index.ts` : tous les enums partagés (`Role`, `TypeEntite`, `StatutKanban`, `StatutClient`, `StatutKyc`, `ScreeningStatut`, `NiveauRisque`, `TypeMission`, `StatutMission`, `TypeObligation`, `StatutObligation`, `TypeOperationSensible`, `StatutOperationSensible`, `TypeContact`, `TypePlanningEtape`, `StatutPlanningEtape`)
- Réécriture des entités existantes : `User` (rôles en majuscules, `deletedAt`), `Client` (champs KYC + SIRENE fusionnés, toutes les relations), `Prospect` (nouveaux champs, `StatutKanban`), `AuditLog` (`ressource`/`ressourceId`, `ipAddress`), `ScoreRisque` (renommage `risk-score` → `score-risque`, réponses ARPEC 4 dimensions)
- 8 nouvelles entités et modules NestJS complets (entity + dto + service + controller + module) : `QuestionnaireAcceptation`, `BeneficiaireEffectif`, `Contact`, `Mission`, `LettreMission`, `PlanningEtape`, `Obligation`, `OperationSensible`
- `ScoringModule` : réécriture de l'algorithme de calcul du risque selon la méthode ARPEC (4 dimensions pondérées, seuils FAIBLE/MOYEN/ÉLEVÉ)
- `ProspectsModule` : génération de référence `QWP-YYYY-NNN`, conversion prospect → client (`POST /prospects/:id/convert`), soft delete
- `ClientsModule` : suppression de toute la logique KYC historique, validation KYC directement sur le client (`PATCH /clients/:id/validate`)
- Mise à jour de `app.module.ts` et `data-source.ts` : les 14 entités et les 14 modules métier enregistrés (const `ALL_ENTITIES` partagée)
- Migration unique `1782000000000-V2Schema.ts` : création des 14 tables dans l'ordre des dépendances FK (`users` → `prospects` → `questionnaire_acceptation` → `clients` → `beneficiaire_effectif` → `contacts` → `missions` → `documents` → `lettre_mission` → `score_risque` → `planning_etape` → `obligations` → `operation_sensible` → `audit_logs`), générée à partir des entités TypeORM et validée dans les deux sens (`up`/`down`)
- `database/seed.ts` : jeu de données de test couvrant les 14 tables (utilisateurs, clients, prospects, questionnaire, bénéficiaire effectif, contact, missions + lettre de mission signée, scores de risque, étape de planning, obligations, opération sensible, journal d'audit)

### Frontend — arborescence complète alignée sur le nouveau backend

- `types/index.ts` réécrit intégralement (16 enums + 14 entités) pour correspondre aux nouvelles entités et enums backend
- `useAuth`, `AppSidebar` et `lib/status.tsx` adaptés aux rôles en majuscules et aux nouveaux statuts (badges KYC, risque, kanban, mission, obligation, opération sensible)
- `/dashboard` : nouveaux KPIs (prospects actifs, clients actifs, clients à risque élevé, obligations en retard)
- Module Prospects : pipeline par statut, fiche prospect, page questionnaire d'acceptation (brouillon JSON + validation/refus)
- Module Clients : liste, création, fiche à 9 onglets (`infos`, `kyc`, `beneficiaires`, `contacts`, `scoring`, `missions`, `planning`, `obligations`, `operations` via `?tab=`)
- Nouvelles vues globales : `/dashboard/cartographie`, `/dashboard/obligations`, `/dashboard/operations-sensibles`, `/dashboard/planning`
- Module Admin réorganisé : `/dashboard/admin` (accueil) + `/dashboard/admin/users` (liste, création, édition)
- Suppression des pages obsolètes `/dashboard/collaborateur`, `/dashboard/responsable`, `/dashboard/scoring` (remplacées par l'onglet scoring de la fiche client)
- Pages volontairement minimales (pas de drag-and-drop Kanban, pas d'intégration SIRENE, questionnaire LAB en éditeur JSON brut plutôt que les 61 questions détaillées) — le design approfondi est laissé à une itération suivante

## [0.2.0] - 2026-06-30

### Backend — premiers modules métier

- Entités TypeORM et migration initiale : `User`, `Client`, `Kyc`, `Document`, `RiskScore`, `AuditLog`
- Seed de données : compte admin + compte collaborateur de test
- `AuthModule` : login JWT, `JwtAuthGuard`, `RolesGuard`
- `ClientsModule` : CRUD des dossiers clients
- `KycModule` : fiche KYC liée au client (relation 1-1)
- `DocumentsModule` : upload et téléchargement de documents
- `ScoringModule` : calcul du score de risque
- `AuditModule` : traçabilité des actions
- `UsersModule` : CRUD utilisateurs (admin)
- `ProspectsModule` : CRUD prospects + migration `AddProspect`
- `ValidationPipe` globale (`whitelist`, `forbidNonWhitelisted`, `transform`)

### Frontend — authentification et dashboard

- Page de connexion + hook `useAuth` (protection des pages, redirection)
- Layout dashboard protégé + `AppSidebar`
- Pages clients : liste, création, fiche détail
- Page admin : gestion des utilisateurs
- Proxy API interne (`src/app/api/[...path]/route.ts`) : plusieurs itérations pour fiabiliser le routage vers le backend (`basePath`, suppression de `trailingSlash` incompatible Turbopack, remplacement du rewrite Edge par une route catch-all, suppression des en-têtes hop-by-hop)

### Documentation

- Réécriture complète de `docs/projet/` (vue d'ensemble, architecture, base de données, sécurité, workflow, déploiement) suite aux retours du jury lors de la soutenance CDA : nouveau périmètre LCB-FT (pipeline prospect Kanban, KYC fusionné dans `Client`, questionnaire d'acceptation LAB, bénéficiaires effectifs, missions/lettres de mission, planning, obligations, opérations sensibles)
- Remplacement du stockage de documents auto-hébergé (Minio) par un prestataire externe managé (**OVHcloud Object Storage**), suite à la remarque du jury sur la sensibilité des pièces d'identité et données KYC
- Création des fichiers de gouvernance du dépôt : `README.md` (racine, backend, frontend, docs), `INSTALL.md`, `CONTRIBUTING.md`, `LICENSE` (propriétaire — tous droits réservés)

## [0.1.0] - 2026-05-29

### Initialisation du projet

- Initialisation du dépôt GitHub avec structure monorepo npm workspaces
- Configuration de l'environnement de développement : Husky, commitlint (conventional commits), lint-staged, Prettier, ESLint
- Correction hook Husky `commit-msg` : suppression de l'appel déprécié à `_/husky.sh` (incompatible Husky v10)

### Stack technique

- **Backend** : NestJS 11 + TypeScript, TypeORM, PostgreSQL, Redis, JWT, Passport
- **Frontend** : Next.js 16 + React 19, Tailwind CSS 4, Radix UI, Recharts, Zod
- Script `dev` racine via `concurrently` : backend sur le port 3001, frontend sur le port 3000

### Docker & déploiement

- Création du `Dockerfile` backend : build multi-stage NestJS (`npm install` → `nest build` → image de production)
- Création du `Dockerfile` frontend : build multi-stage Next.js avec `BACKEND_URL` injecté en ARG au moment du build pour les rewrites serveur
- Création du `deployment/docker-compose.yml` de production : services `qw-app-backend` (port interne 3001), `qw-app-frontend` (port 3006 exposé), `qw-app-postgres`, `qw-app-redis`
- Configuration `deployment/.env.example` avec les variables nécessaires (PostgreSQL, Redis, JWT, PORT)

### Intégration vps-monitor

- Enregistrement de l'app dans `apps.json` de vps-monitor : nom `qw-app`, chemin `/qw-app/`, port `3006`
- Déploiement via vps-monitor avec clonage sur la branche `staging`
- Configuration nginx : location `/qw-app/` → port 3006 avec préfixe conservé (`stripPrefix: false`)
- `basePath: '/qw-app'` ajouté dans `next.config.ts` en production pour que les assets `/_next/` soient routés correctement par nginx

### CI/CD

- Création du workflow GitHub Actions `.github/workflows/staging.yml` : déclenché sur push vers `staging`, appelle le webhook vps-monitor (`POST /api/webhook/deploy`) pour déclencher automatiquement le `git pull` + rebuild Docker
